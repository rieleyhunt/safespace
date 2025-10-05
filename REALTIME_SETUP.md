# Real-time Setup Guide

## Issue: Buddies Not Receiving Requests

### Current System Architecture

The system uses an **individual request model** where:
1. User requests help → Server finds all nearby buddies
2. Frontend creates **separate requests** for each buddy in the database
3. Each buddy receives their own request via Supabase real-time
4. **First buddy to accept wins** (first-come-first-served)

### Required Setup Steps

#### 1. Enable Real-time on Supabase

Run the SQL migration to enable real-time:

```sql
-- Enable real-time for buddy_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE buddy_requests;
```

Or via Supabase Dashboard:
1. Go to Database → Replication
2. Find `buddy_requests` table
3. Enable real-time replication

#### 2. Verify RLS Policies

Ensure these policies exist (already in `create_buddy_requests_table.sql`):

```sql
-- Buddies can view their requests
CREATE POLICY "Buddies can view their requests" ON buddy_requests
  FOR SELECT USING (auth.uid() = buddy_id);

-- Users can view their requests
CREATE POLICY "Users can view their requests" ON buddy_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create requests" ON buddy_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Buddies can update their requests
CREATE POLICY "Buddies can update their requests" ON buddy_requests
  FOR UPDATE USING (auth.uid() = buddy_id);
```

#### 3. Test Real-time Connection

Open browser console on buddy page and check for:
```
[BUDDY] Setting up real-time listener for buddy: <uuid>
[BUDDY] Checking for existing pending requests...
```

#### 4. Test Request Creation

Open browser console on user page and check for:
```
[USER] Creating requests for 2 buddies: [...]
[USER] Sending request to buddy: <name> (<uuid>)
[USER] ✓ Request created successfully for <name>
```

### Debugging Checklist

- [ ] Real-time is enabled for `buddy_requests` table in Supabase
- [ ] RLS policies are correctly configured
- [ ] Buddies are authenticated and have valid UUIDs
- [ ] Buddies have `available = true` in the database
- [ ] Buddy locations are being tracked (check `buddy_live_locations` table)
- [ ] Browser console shows real-time subscription is active
- [ ] No CORS or network errors in browser console

### Common Issues

**Issue**: Buddies don't receive requests
- **Cause**: Real-time not enabled on Supabase
- **Fix**: Run `ALTER PUBLICATION supabase_realtime ADD TABLE buddy_requests;`

**Issue**: "Request not found" or permission denied
- **Cause**: RLS policies blocking access
- **Fix**: Verify policies match the buddy's UUID

**Issue**: Requests created but not visible
- **Cause**: Real-time subscription not active
- **Fix**: Check browser console for subscription errors

### Expected Flow

1. **User creates request** → Logs show: `[USER] Request created successfully for <buddy>`
2. **Buddy receives real-time event** → Logs show: `[BUDDY] New request received: <request_id>`
3. **Buddy accepts** → Logs show: `[BUDDY] Request accepted successfully: <request_id>`
4. **Other buddies notified** → Their requests auto-hide (if implemented)

### Testing with Multiple Buddies

1. Open 2+ buddy pages in different browsers/incognito windows
2. Login as different buddies
3. Create a request from user page
4. **All buddies should see the request simultaneously**
5. First buddy to accept wins
6. Other buddies should see "Request no longer available" (if they try to accept)
