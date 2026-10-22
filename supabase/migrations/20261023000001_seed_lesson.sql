-- Seed satu materi secara atomik (dipanggil scripts/seed-content.ts lewat RPC).
-- payload: { lesson: {...}, characters: [...], turns: [...], sentences: [...],
--            lexemes: [...], lesson_vocabulary: [...], verbs: [...], lesson_verbs: [...],
--            grammar_points: [...], lesson_grammar: [...], expressions: [...],
--            lesson_expressions: [...], quizzes: [...], questions: [...], drills: [...], glossary: [...] }
-- Nama field = nama kolom. Baris materi lama dihapus (cascade) lalu diisi ulang;
-- tabel bersama (lexemes, verbs, grammar_points, expressions) di-upsert.

create function public.seed_lesson(payload jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  lid text := payload->'lesson'->>'id';
begin
  if lid is null then
    raise exception 'seed_lesson: payload.lesson.id kosong' using errcode = '22023';
  end if;

  delete from public.lessons where id = lid;

  insert into public.lessons select * from jsonb_populate_record(null::public.lessons, payload->'lesson');

  insert into public.lexemes as x select * from jsonb_populate_recordset(null::public.lexemes, payload->'lexemes')
  on conflict (id) do update set headword = excluded.headword, reading = excluded.reading,
    romaji = excluded.romaji, jmdict_seq = excluded.jmdict_seq;

  insert into public.verbs select * from jsonb_populate_recordset(null::public.verbs, payload->'verbs')
  on conflict (lexeme_id) do update set jmdict_class = excluded.jmdict_class,
    verb_group = excluded.verb_group, forms = excluded.forms;

  insert into public.grammar_points select * from jsonb_populate_recordset(null::public.grammar_points, payload->'grammar_points')
  on conflict (id) do update set pattern = excluded.pattern, level = excluded.level;

  insert into public.expressions select * from jsonb_populate_recordset(null::public.expressions, payload->'expressions')
  on conflict (id) do update set tokens = excluded.tokens, ruby = excluded.ruby, romaji = excluded.romaji;

  insert into public.characters select * from jsonb_populate_recordset(null::public.characters, payload->'characters');
  insert into public.turns select * from jsonb_populate_recordset(null::public.turns, payload->'turns');
  insert into public.sentences select * from jsonb_populate_recordset(null::public.sentences, payload->'sentences');
  insert into public.lesson_vocabulary select * from jsonb_populate_recordset(null::public.lesson_vocabulary, payload->'lesson_vocabulary');
  insert into public.lesson_verbs select * from jsonb_populate_recordset(null::public.lesson_verbs, payload->'lesson_verbs');
  insert into public.lesson_grammar select * from jsonb_populate_recordset(null::public.lesson_grammar, payload->'lesson_grammar');
  insert into public.lesson_expressions select * from jsonb_populate_recordset(null::public.lesson_expressions, payload->'lesson_expressions');
  insert into public.quizzes select * from jsonb_populate_recordset(null::public.quizzes, payload->'quizzes');
  insert into public.questions select * from jsonb_populate_recordset(null::public.questions, payload->'questions');
  insert into public.drills select * from jsonb_populate_recordset(null::public.drills, payload->'drills');
  insert into public.glossary select * from jsonb_populate_recordset(null::public.glossary, payload->'glossary');

  return (select content_hash from public.lessons where id = lid);
end;
$$;

revoke execute on function public.seed_lesson(jsonb) from public, anon, authenticated;
grant execute on function public.seed_lesson(jsonb) to service_role;
