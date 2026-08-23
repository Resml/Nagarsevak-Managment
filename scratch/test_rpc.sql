BEGIN; 
SET SESSION AUTHORIZATION authenticated; 
SELECT set_config('request.jwt.claims', '{"sub": "d90b8574-41ea-42f4-8807-a5ec1796683b"}', true); 
SELECT log_security_event('test_rpc_event', '{"test": true}'::jsonb, 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'); 
COMMIT;
