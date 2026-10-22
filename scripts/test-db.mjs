import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
// Uji migrasi + RLS tanpa Docker: PGlite dengan stub role dan skema auth Supabase.
const dir = process.argv[2] ?? "supabase/migrations";
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
`);
for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  try { await db.exec(readFileSync(`${dir}/${f}`, "utf8")); console.log("OK migration", f); } catch (e) { console.log("MIGRATION FAIL", f, e.message, e.position, e.where); process.exit(2); }
}
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
const results = [];
const check = (name, cond) => { results.push([cond ? 'PASS' : 'FAIL', name]); };
// seed as service_role
await db.exec(`set role service_role;
  insert into public.lessons (id, seq, slug, level, title_ja, title_ind, situation_ind, location_ind, estimated_minutes, content_hash, published)
  values ('L001',1,'perkenalan-diri','N5','[]','Perkenalan Diri','s','l',30,'h',true),
         ('L002',2,'draf','N5','[]','Draf','s','l',30,'h',false);
  insert into public.characters values ('L001','rina',1,'[]','Rina','murid','teineigo',null),('L002','x',1,'[]','X','x','teineigo',null);
  reset role;
  insert into auth.users values ('${A}'),('${B}');`);
const as = async (role, sub, sql, params) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false);`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role;'); }
};
let r = await as('anon', null, 'select id from public.lessons order by id');
check('anon hanya melihat materi published', r.rows.map(x=>x.id).join() === 'L001');
r = await as('anon', null, 'select lesson_id from public.characters');
check('anon tidak melihat tokoh materi draf', r.rows.length === 1 && r.rows[0].lesson_id === 'L001');
try { await as('anon', null, "insert into public.lessons (id,seq,slug,level,title_ja,title_ind,situation_ind,location_ind,estimated_minutes,content_hash) values ('L009',9,'x','N5','[]','x','x','x',1,'h')"); check('anon tidak bisa menulis konten', false); } catch { check('anon tidak bisa menulis konten', true); }
try { await as('anon', null, "select public.merge_progress('[]')"); check('anon tidak bisa memanggil merge_progress', false); } catch { check('anon tidak bisa memanggil merge_progress', true); }
const items = JSON.stringify([{item_type:'lesson',item_id:'L001',status:'started',attempts:0},{item_type:'quiz',item_id:'L001.quiz',status:'completed',first_score:3,best_score:3,attempts:1}]);
await as('authenticated', A, 'select * from public.merge_progress($1::jsonb)', [items]);
const items2 = JSON.stringify([{item_type:'lesson',item_id:'L001',status:'completed',attempts:0},{item_type:'quiz',item_id:'L001.quiz',status:'started',first_score:5,best_score:2,attempts:4}]);
await as('authenticated', A, 'select * from public.merge_progress($1::jsonb)', [items2]);
await as('authenticated', A, 'select * from public.merge_progress($1::jsonb)', [items2]);
r = await as('authenticated', A, "select item_id,status,first_score,best_score,attempts from public.user_progress order by item_id");
const q = r.rows.find(x=>x.item_id==='L001.quiz'), l = r.rows.find(x=>x.item_id==='L001');
check('merge: status completed menang', l.status === 'completed' && q.status === 'completed');
check('merge: first_score tetap percobaan pertama', q.first_score === 3);
check('merge: best_score = maksimum', q.best_score === 3);
check('merge: attempts = maksimum, idempoten', q.attempts === 4);
r = await as('authenticated', B, 'select * from public.user_progress');
check('B tidak melihat progres A', r.rows.length === 0);
r = await as('authenticated', B, "update public.user_progress set best_score = 0 where user_id = '" + A + "' returning *");
check('B tidak bisa mengubah progres A', r.rows.length === 0);
try { await as('authenticated', A, 'select * from public.merge_progress($1::jsonb)', [JSON.stringify([{item_type:'quiz',item_id:'L001.quiz',status:'started',best_score:9}])]); check('skor > 5 ditolak', false); } catch { check('skor > 5 ditolak', true); }
try { await as('authenticated', A, 'select * from public.merge_progress($1::jsonb)', [JSON.stringify([{item_type:'lesson',item_id:'xyz',status:'started'}])]); check('format item_id salah ditolak', false); } catch { check('format item_id salah ditolak', true); }
await as('authenticated', B, 'select public.delete_my_account()');
r = await db.query('select id from auth.users order by id');
check('delete_my_account hanya menghapus pemanggil', r.rows.length === 1 && r.rows[0].id === A);
await as('authenticated', A, 'select public.delete_my_account()');
r = await db.query('select count(*)::int as n from public.user_progress');
check('progres ikut terhapus saat akun dihapus', r.rows[0].n === 0);
r = await as('anon', null, 'select * from public.review_vocabulary');
check('view review bisa dibaca anon', Array.isArray(r.rows));
for (const [s, n] of results) console.log(s, n);
process.exit(results.some(([s]) => s === 'FAIL') ? 1 : 0);
