-- Add new fields to tasks table
ALTER TABLE tasks 
ADD COLUMN office_name text,
ADD COLUMN meet_person_name text,
ADD COLUMN assigned_staff_id uuid REFERENCES staff(id);

COMMENT ON COLUMN tasks.office_name IS 'Name of the office related to the task';
COMMENT ON COLUMN tasks.meet_person_name IS 'Name of the person to meet';
COMMENT ON COLUMN tasks.assigned_staff_id IS 'ID of the staff member assigned to the task';
