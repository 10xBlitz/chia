-- Supabase Edge Function (Postgres RPC) for fetching chat rooms ordered by latest message, with pagination and search

create or replace function fetch_rooms_by_latest_message(
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  category text,
  patient_full_name text,
  last_admin_read_at timestamptz,
  latest_message_created_at timestamptz
)
language sql
as $$
  select
    cr.id,
    cr.category,
    u.full_name as patient_full_name,
    cr.last_admin_read_at,
    lm.created_at as latest_message_created_at
  from chat_room cr
  left join (
    select m.chat_room_id, max(m.created_at) as created_at
    from message m
    group by m.chat_room_id
  ) lm on cr.id = lm.chat_room_id
  left join "user" u on u.id = cr.patient_id
  where
    (
      p_search is null
      or trim(p_search) = ''
      or (u.full_name is not null and u.full_name ilike '%' || p_search || '%')
    )
  order by
    coalesce(lm.created_at, cr.created_at) desc,
    cr.created_at desc
  limit p_limit offset p_offset
$$;
