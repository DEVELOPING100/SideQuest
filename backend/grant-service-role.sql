-- Grant the Spring Boot backend access to SideQuest tables through Supabase.
-- This does not grant access to the public anon or authenticated roles.

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.users to service_role;
grant select, insert, update, delete on table public.adventures to service_role;
grant select, insert, update, delete on table public.stops to service_role;
grant select, insert, update, delete on table public.stamps to service_role;
