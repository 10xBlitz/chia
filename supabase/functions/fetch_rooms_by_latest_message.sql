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
  last_patient_read_at timestamptz, -- added
  latest_message_created_at timestamptz,
  latest_message text, -- latest message content
  latest_message_sender_id uuid, -- NEW: sender's id
  latest_message_sender_full_name text -- sender's full name
)
language sql
as $$
  select
    cr.id,
    cr.category,
    u.full_name as patient_full_name,
    cr.last_admin_read_at,
    cr.last_user_read_at as last_patient_read_at, -- added
    lm.created_at as latest_message_created_at,
    m.content as latest_message, -- latest message content
    m.sender_id as latest_message_sender_id, -- sender's id
    su.full_name as latest_message_sender_full_name -- sender's full name
  from chat_room cr
  left join (
    select m.chat_room_id, max(m.created_at) as created_at
    from message m
    group by m.chat_room_id
  ) lm on cr.id = lm.chat_room_id
  left join message m on m.chat_room_id = cr.id and m.created_at = lm.created_at
  left join "user" su on su.id = m.sender_id -- sender user
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
