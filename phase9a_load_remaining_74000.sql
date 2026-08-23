INSERT INTO public.voters (
    epic_no,
    name_marathi,
    name_english,
    relation_name_marathi,
    relation_name_english,
    relation_type,
    house_no,
    age,
    gender,
    address_marathi,
    address_english,
    ac_no,
    part_no,
    serial_no,
    new_serial_no,
    mobile,
    ward_no,
    caste,
    is_verified,
    is_friend_relative,
    tenant_id,
    dob,
    current_address_english,
    current_address_marathi,
    profession,
    favour
)
SELECT
    'STG' || lpad(gs::text, 7, '0'),

    'नाव मराठी ' || gs,

    'Voter Name ' || gs,

    'पालक ' || gs,

    'Relation ' || gs,

    CASE
        WHEN gs % 2 = 0 THEN 'Father'
        ELSE 'Husband'
    END,

    (100 + (gs % 900))::text,

    18 + (gs % 63),

    CASE
        WHEN gs % 2 = 0 THEN 'Male'
        ELSE 'Female'
    END,

    'पुणे स्टेजिंग पत्ता ' || gs,

    'Staging Pune Address ' || gs,

    1 + (gs % 5),

    1 + (gs % 50),

    gs::text,

    gs,

    '90000' || lpad((gs % 100000)::text, 5, '0'),

    1 + (gs % 10),

    CASE gs % 5
        WHEN 0 THEN 'Open'
        WHEN 1 THEN 'OBC'
        WHEN 2 THEN 'SC'
        WHEN 3 THEN 'ST'
        ELSE 'Other'
    END,

    gs % 3 <> 0,

    gs % 7 = 0,

    (
        SELECT id
        FROM public.tenants
        WHERE subdomain =
            'staging-tenant-' ||
            (1 + ((gs - 1) % 10))
    ),

    CURRENT_DATE - (gs % 20000)::integer,

    'Staging Current Address ' || gs,

    'स्टेजिंग सध्याचा पत्ता ' || gs,

    CASE gs % 4
        WHEN 0 THEN 'Business'
        WHEN 1 THEN 'Service'
        WHEN 2 THEN 'Farmer'
        ELSE 'Other'
    END,

    CASE gs % 3
        WHEN 0 THEN 'Yes'
        WHEN 1 THEN 'No'
        ELSE 'Neutral'
    END

FROM generate_series(1001, 75000) AS gs;