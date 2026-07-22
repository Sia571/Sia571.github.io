-- Sia Portfolio / Public guestbook
-- Run this once in Supabase Dashboard -> SQL Editor.

create table if not exists public.guestbook_messages (
  id bigint generated always as identity primary key,
  name text not null default '一位路过的读者',
  message text not null,
  created_at timestamptz not null default now(),
  is_visible boolean not null default false,
  constraint guestbook_name_length check (char_length(btrim(name)) between 1 and 24),
  constraint guestbook_message_length check (char_length(btrim(message)) between 1 and 240)
);

alter table public.guestbook_messages enable row level security;

-- Public visitors may only read messages that Sia has approved.
drop policy if exists "Public can read approved guestbook messages" on public.guestbook_messages;
create policy "Public can read approved guestbook messages"
on public.guestbook_messages
for select
to anon
using (is_visible = true);

-- Public visitors may submit a pending message, but cannot publish it themselves.
drop policy if exists "Public can submit pending guestbook messages" on public.guestbook_messages;
create policy "Public can submit pending guestbook messages"
on public.guestbook_messages
for insert
to anon
with check (is_visible = false);

-- Least-privilege grants: visitors cannot update, delete, or set moderation fields.
revoke all on table public.guestbook_messages from anon, authenticated;
grant select (id, name, message, created_at, is_visible)
  on table public.guestbook_messages to anon;
grant insert (name, message)
  on table public.guestbook_messages to anon;
grant usage, select on sequence public.guestbook_messages_id_seq to anon;

-- After a new note arrives, approve it in Table Editor by setting is_visible to true.
-- Hide or remove an unsuitable note from the Supabase dashboard at any time.
