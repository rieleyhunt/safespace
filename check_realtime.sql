-- Check if real-time is enabled for buddy_requests table
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- If buddy_requests is NOT in the list above, run this:
-- ALTER PUBLICATION supabase_realtime ADD TABLE buddy_requests;

-- Check recent buddy requests
SELECT 
  br.id,
  br.user_id,
  br.buddy_id,
  b.name as buddy_name,
  br.status,
  br.created_at,
  br.updated_at
FROM buddy_requests br
LEFT JOIN buddies b ON b.id = br.buddy_id
ORDER BY br.created_at DESC
LIMIT 10;

-- Check available buddies
SELECT 
  id,
  name,
  email,
  available,
  created_at
FROM buddies
WHERE available = true;

-- Check buddy locations
SELECT 
  bll.buddy_id,
  b.name,
  bll.lat,
  bll.lon,
  bll.updated_at
FROM buddy_live_locations bll
INNER JOIN buddies b ON b.id = bll.buddy_id
WHERE bll.updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY bll.updated_at DESC;
