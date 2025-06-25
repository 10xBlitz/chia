-- Supabase RPC: get_paginated_users_with_email
-- Returns paginated users with email, filters, sorting, and total count for pagination

create or replace function get_paginated_users_with_email(
  p_page integer default 1,
  p_limit integer default 10,
  p_full_name text default null,
  p_category text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_sort text default 'created_at',
  p_order text default 'desc'
)
returns table (
  items jsonb,
  total integer
) as $$
declare
  v_offset integer := (p_page - 1) * p_limit;
begin
  return query
    with result as (
      select
        (
          select coalesce(jsonb_agg(row_to_json(u)), '[]'::jsonb) from (
            select
              u.id::uuid,
              u.full_name::text,
              u.role::text,
              u.created_at::timestamptz,
              u.login_status::text,
              u.gender::text,
              u.birthdate::date,
              u.residence::text,
              u.work_place::text,
              u.contact_number::text,
              u.clinic_id::uuid,
              au.email::text
            from "user" u
            join auth.users au on u.id = au.id
            where u.login_status = 'active'
              and (p_full_name is null or u.full_name ilike '%' || p_full_name || '%')
              and (p_category is null or u.role::text = p_category)
              and (p_date_from is null or u.created_at >= p_date_from)
              and (p_date_to is null or u.created_at <= p_date_to)
            order by
              case when lower(p_order) = 'asc' then
                case when p_sort = 'created_at' then u.created_at end
              end asc,
              case when lower(p_order) = 'desc' then
                case when p_sort = 'created_at' then u.created_at end
              end desc
            offset v_offset limit p_limit
          ) u
        ) as items,
        (
          select count(*)
          from "user" u
          join auth.users au on u.id = au.id
          where u.login_status = 'active'
            and (p_full_name is null or u.full_name ilike '%' || p_full_name || '%')
            and (p_category is null or u.role::text = p_category)
            and (p_date_from is null or u.created_at >= p_date_from)
            and (p_date_to is null or u.created_at <= p_date_to)
        ) as total
    )
    select
      result.items::jsonb as items,
      result.total::integer as total
    from result;
end;
$$ language plpgsql security definer;
