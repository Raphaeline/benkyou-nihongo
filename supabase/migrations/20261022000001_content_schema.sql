-- Skema konten materi (PRD §11.3, D1-A).
-- Ditulis hanya oleh seed:content memakai secret key (service_role).
-- Dibaca publik (anon, authenticated) hanya untuk materi yang published.
-- Teks Jepang disimpan sebagai array token jsonb (docs/CONTENT_SPEC.md).

-- ---------------------------------------------------------------------------
-- Materi dan dialog
-- ---------------------------------------------------------------------------

create table public.lessons (
  id                 text primary key check (id ~ '^L[0-9]{3}$'),
  seq                int  not null unique check (seq > 0),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  level              text not null check (level in ('N5', 'N4')),
  title_ja           jsonb not null,
  title_ind          text not null,
  situation_ind      text not null,
  location_ind       text not null,
  objectives_ind     text[] not null default '{}',
  estimated_minutes  int  not null check (estimated_minutes > 0),
  reading_guide      jsonb not null default '[]',
  roleplay_guide_ind text,
  review_status      text not null default 'ai-draft' check (review_status in ('ai-draft', 'reviewed')),
  published          boolean not null default false,
  content_hash       text not null,
  updated_at         timestamptz not null default now()
);

create table public.characters (
  lesson_id         text not null references public.lessons on delete cascade,
  id                text not null check (id ~ '^[a-z][a-z0-9-]*$'),
  seq               int  not null,
  name              jsonb not null,
  name_romaji       text not null,
  relation_ind      text not null,
  register_default  text not null check (register_default in ('teineigo', 'futsuu', 'campuran')),
  register_note_ind text,
  primary key (lesson_id, id),
  unique (lesson_id, seq)
);

create table public.turns (
  lesson_id  text not null,
  dialogue   text not null check (dialogue in ('main', 'variation')),
  seq        int  not null check (seq > 0),
  speaker_id text not null,
  primary key (lesson_id, dialogue, seq),
  foreign key (lesson_id) references public.lessons on delete cascade,
  foreign key (lesson_id, speaker_id) references public.characters (lesson_id, id) on delete cascade
);

create table public.sentences (
  id              text primary key,             -- 'L001.main.03.2'
  lesson_id       text not null,
  dialogue        text not null,
  turn_seq        int  not null,
  seq             int  not null check (seq > 0),
  tokens          jsonb not null,
  ruby            jsonb not null,               -- segmen ruby hasil build:content
  text_ja         text not null,                -- teks polos untuk pencarian/salin
  romaji          text not null,                -- hasil generator, bukan ditulis manual
  translation_ind text not null,
  note_ind        text,
  register        text check (register in ('teineigo', 'futsuu', 'campuran')),
  foreign key (lesson_id, dialogue, turn_seq) references public.turns on delete cascade,
  unique (lesson_id, dialogue, turn_seq, seq)
);

create index sentences_lesson_idx on public.sentences (lesson_id);

-- ---------------------------------------------------------------------------
-- Kosakata dan kata kerja (lexemes dipakai lintas materi untuk Review)
-- ---------------------------------------------------------------------------

create table public.lexemes (
  id         text primary key,                  -- mis. 'kaisha', 'kuru'
  headword   text not null,
  reading    text not null,
  romaji     text not null,
  jmdict_seq int unique,
  unique (headword, reading)
);

create table public.lesson_vocabulary (
  lesson_id         text not null references public.lessons on delete cascade,
  lexeme_id         text not null references public.lexemes on delete restrict,
  seq               int  not null,
  meaning_ind       text not null,
  pos_ind           text not null,
  first_sentence_id text not null references public.sentences on delete cascade,
  example           jsonb not null,             -- {tokens, ruby, romaji, translation_ind}
  primary key (lesson_id, lexeme_id),
  unique (lesson_id, seq)
);

create table public.verbs (
  lexeme_id    text primary key references public.lexemes on delete restrict,
  jmdict_class text not null,                   -- mis. 'v5k-s', 'v1', 'vk', 'vs-i'
  verb_group   smallint not null check (verb_group between 1 and 3),
  forms        jsonb not null                   -- hasil conjugator: {masu:{surface,reading,romaji,ruby}, ...}
);

create table public.lesson_verbs (
  lesson_id      text not null references public.lessons on delete cascade,
  lexeme_id      text not null references public.verbs on delete restrict,
  seq            int  not null,
  role           text not null check (role in ('utama', 'tambahan')),
  meaning_ind    text not null,
  group_note_ind text,
  dialogue_forms jsonb not null,                -- [{form, surface, sentence_ids[]}]
  primary key (lesson_id, lexeme_id),
  unique (lesson_id, seq)
);

-- ---------------------------------------------------------------------------
-- Tata bahasa dan ungkapan (ID stabil lintas materi, mis. 'kara-asal')
-- ---------------------------------------------------------------------------

create table public.grammar_points (
  id      text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  pattern text not null,
  level   text not null check (level in ('N5', 'N4'))
);

create table public.lesson_grammar (
  lesson_id           text not null references public.lessons on delete cascade,
  grammar_id          text not null references public.grammar_points on delete restrict,
  seq                 int  not null,
  function_ind        text not null,
  formula             text not null,
  example_sentence_id text not null references public.sentences on delete cascade,
  example_translation_ind text not null,
  new_example         jsonb not null,           -- {tokens, ruby, romaji, translation_ind}
  primary key (lesson_id, grammar_id),
  unique (lesson_id, seq)
);

create table public.expressions (
  id     text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tokens jsonb not null,
  ruby   jsonb not null,
  romaji text not null
);

create table public.lesson_expressions (
  lesson_id     text not null references public.lessons on delete cascade,
  expression_id text not null references public.expressions on delete restrict,
  seq           int  not null,
  meaning_ind   text not null,
  context_ind   text not null,
  politeness_ind text not null,
  situation_ind text not null,
  comparison    jsonb not null,                 -- {formal:[...], casual:[...], note_ind}
  alternatives  jsonb not null default '[]',
  primary key (lesson_id, expression_id),
  unique (lesson_id, seq)
);

-- ---------------------------------------------------------------------------
-- Latihan dan latihan berbicara
-- ---------------------------------------------------------------------------

create table public.quizzes (
  id        text primary key check (id ~ '^L[0-9]{3}\.quiz(\.[0-9]+)?$'),
  lesson_id text not null references public.lessons on delete cascade,
  seq       int  not null,
  unique (lesson_id, seq)
);

create table public.questions (
  id              text primary key,             -- 'L001.quiz.q1'
  quiz_id         text not null references public.quizzes on delete cascade,
  seq             int  not null,
  type            text not null check (type in ('comprehension', 'vocabulary', 'completion', 'conjugation')),
  prompt          jsonb not null,
  options         jsonb,                        -- null untuk soal input teks
  answer          jsonb not null,
  explanation_ind text not null,
  unique (quiz_id, seq)
);

create table public.drills (
  lesson_id text not null references public.lessons on delete cascade,
  seq       int  not null,
  pattern   jsonb not null,
  items     jsonb not null,                     -- kalimat lengkap yang sudah divalidasi
  primary key (lesson_id, seq)
);

create table public.glossary (
  lesson_id   text not null references public.lessons on delete cascade,
  seq         int  not null,
  word        jsonb not null,
  romaji      text not null,
  meaning_ind text not null,
  primary key (lesson_id, seq)
);

-- ---------------------------------------------------------------------------
-- View untuk halaman Review (menghormati RLS pemanggil)
-- ---------------------------------------------------------------------------

create view public.review_vocabulary with (security_invoker = true) as
  select x.id, x.headword, x.reading, x.romaji,
         min(l.seq) as first_seq,
         array_agg(lv.lesson_id order by l.seq) as lesson_ids
  from public.lexemes x
  join public.lesson_vocabulary lv on lv.lexeme_id = x.id
  join public.lessons l on l.id = lv.lesson_id and l.published
  group by x.id;

create view public.review_verbs with (security_invoker = true) as
  select v.lexeme_id, x.headword, x.reading, v.verb_group, v.forms,
         min(l.seq) as first_seq,
         array_agg(lv.lesson_id order by l.seq) as lesson_ids
  from public.verbs v
  join public.lexemes x on x.id = v.lexeme_id
  join public.lesson_verbs lv on lv.lexeme_id = v.lexeme_id
  join public.lessons l on l.id = lv.lesson_id and l.published
  group by v.lexeme_id, x.headword, x.reading, v.verb_group, v.forms;

create view public.review_grammar with (security_invoker = true) as
  select g.id, g.pattern, g.level,
         min(l.seq) as first_seq,
         array_agg(lg.lesson_id order by l.seq) as lesson_ids
  from public.grammar_points g
  join public.lesson_grammar lg on lg.grammar_id = g.id
  join public.lessons l on l.id = lg.lesson_id and l.published
  group by g.id;

-- ---------------------------------------------------------------------------
-- RLS dan GRANT
-- Sejak perubahan Data API Supabase, tabel tanpa GRANT eksplisit tidak bisa
-- diakses, dan BYPASSRLS milik service_role tidak melewati GRANT.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'lessons', 'characters', 'turns', 'sentences', 'lexemes', 'lesson_vocabulary',
    'verbs', 'lesson_verbs', 'grammar_points', 'lesson_grammar', 'expressions',
    'lesson_expressions', 'quizzes', 'questions', 'drills', 'glossary'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;

grant select on public.review_vocabulary, public.review_verbs, public.review_grammar
  to anon, authenticated, service_role;

create policy "lessons: baca yang published" on public.lessons
  for select to anon, authenticated using (published);

-- Tabel anak mengikuti status published materi induknya.
do $$
declare
  t text;
begin
  foreach t in array array[
    'characters', 'turns', 'sentences', 'lesson_vocabulary', 'lesson_verbs',
    'lesson_grammar', 'lesson_expressions', 'quizzes', 'drills', 'glossary'
  ] loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (
         exists (select 1 from public.lessons l where l.id = lesson_id and l.published))',
      t || ': baca jika materi published', t);
  end loop;
end $$;

create policy "questions: baca jika materi published" on public.questions
  for select to anon, authenticated using (
    exists (
      select 1 from public.quizzes q join public.lessons l on l.id = q.lesson_id
      where q.id = quiz_id and l.published
    )
  );

-- Data bersama lintas materi (tidak berisi konten yang belum dipublikasikan).
create policy "lexemes: baca" on public.lexemes for select to anon, authenticated using (true);
create policy "verbs: baca" on public.verbs for select to anon, authenticated using (true);
create policy "grammar_points: baca" on public.grammar_points for select to anon, authenticated using (true);
create policy "expressions: baca" on public.expressions for select to anon, authenticated using (true);
