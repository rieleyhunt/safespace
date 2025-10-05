-- STEP 1: Check if real-time is enabled for buddy_requests
-- Run this first to see if buddy_requests is in the list
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- STEP 2: If buddy_requests is NOT in the list above, run this to enable it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE buddy_requests;

-- STEP 3: Check if there are any buddy requests in the database
SELECT 
  br.id,
  br.user_id,
  br.buddy_id,
  b.name as buddy_name,
  br.status,
  br.user_lat,
  br.user_lon,
  br.destination,
  br.created_at
FROM buddy_requests br
LEFT JOIN buddies b ON b.id = br.buddy_id
ORDER BY br.created_at DESC
LIMIT 5;

-- STEP 4: Check available buddies
SELECT 
  id,
  name,
  email,
  available
FROM buddies
WHERE available = true;

-- STEP 5: Check recent buddy locations (last 10 minutes)
SELECT 
  bll.buddy_id,
  b.name as buddy_name,
  bll.lat,
  bll.lon,
  bll.updated_at,
  AGE(NOW(), bll.updated_at) as time_ago
FROM buddy_live_locations bll
INNER JOIN buddies b ON b.id = bll.buddy_id
WHERE bll.updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY bll.updated_at DESC;

-- STEP 6: Check RLS policies on buddy_requests
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'buddy_requests';
