-- Function to create a task when a visitor is logged as Greeting or Invitation
CREATE OR REPLACE FUNCTION create_task_from_visitor()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if purpose is Greeting or Invitation
    IF NEW.purpose IN ('Greeting', 'Invitation') THEN
        INSERT INTO tasks (
            title,
            description,
            priority,
            due_date,
            due_time,
            status,
            tenant_id,
            office_name,
            meet_person_name,
            created_at,
            updated_at
        )
        VALUES (
            -- Title
            NEW.purpose || ' from ' || NEW.name,
            
            -- Description
            'Event Date: ' || COALESCE(NEW.metadata->>'event_date', 'N/A') || E'\n' ||
            'Time: ' || COALESCE(NEW.metadata->>'event_time', 'N/A') || E'\n' ||
            'Venue: ' || COALESCE(NEW.area, 'N/A') || E'\n' ||
            'Mobile: ' || NEW.mobile || E'\n' ||
            'Remarks: ' || COALESCE(NEW.remarks, ''),
            
            -- Priority
            'Medium',
            
            -- Due Date (Use event date if available, else today)
            COALESCE((NEW.metadata->>'event_date')::date, CURRENT_DATE),
            
            -- Due Time
            COALESCE(NULLIF(NEW.metadata->>'event_time', ''), '09:00')::time,
            
            -- Status
            'Pending',
            
            -- Tenant ID
            NEW.tenant_id,
            
            -- Office Name (Venue)
            NEW.area,
            
            -- Meet Person Name
            NEW.name,
            
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS trigger_create_task_from_visitor ON visitors;

CREATE TRIGGER trigger_create_task_from_visitor
AFTER INSERT ON visitors
FOR EACH ROW
EXECUTE FUNCTION create_task_from_visitor();
