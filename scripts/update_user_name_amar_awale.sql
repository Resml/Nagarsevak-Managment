UPDATE auth.users
SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', 'Amar Awale', 'full_name', 'Amar Awale')
WHERE id = '8173f741-bef7-4c78-bf61-603f524338ff';
