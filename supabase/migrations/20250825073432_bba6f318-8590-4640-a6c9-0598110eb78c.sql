-- Update David Vos to admin role
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = '200eb54d-f5d3-41c2-b48c-4fe1c4c747a6';

-- Log this role change in audit logs
INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
VALUES (
  '200eb54d-f5d3-41c2-b48c-4fe1c4c747a6',
  'admin_role_granted',
  'profiles', 
  '200eb54d-f5d3-41c2-b48c-4fe1c4c747a6',
  jsonb_build_object('role', 'user'),
  jsonb_build_object('role', 'admin')
);