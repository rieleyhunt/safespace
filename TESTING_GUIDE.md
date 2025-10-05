# Testing Guide: Buddy Request Broadcast System

## Quick Start

### 1. Enable Real-time in Supabase

**Option A: Via SQL Editor**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE buddy_requests;
```

**Option B: Via Dashboard**
1. Go to Database → Replication
2. Find `buddy_requests` table
3. Toggle "Enable Realtime"

### 2. Open Debug Dashboard

Navigate to: `http://localhost:3000/debug.html`

This shows:
- All buddies in database
- All buddy requests
- In-memory volunteer data
- Test tools

### 3. Test the Flow

#### Setup (2 Buddy Windows + 1 User Window)

1. **Window 1**: Open `http://localhost:3000/buddy-index.html` (Buddy 1)
   - Login as first buddy
   - Open browser console (F12)
   - Should see: `[BUDDY] Setting up real-time listener for buddy: <uuid>`

2. **Window 2**: Open `http://localhost:3000/buddy-index.html` in incognito (Buddy 2)
   - Login as second buddy
   - Open browser console (F12)
   - Should see same setup message

3. **Window 3**: Open `http://localhost:3000/user-index.html` (User)
   - Login as user
   - Open browser console (F12)

#### Test Scenario 1: All Buddies Receive Request

1. In **User window**, click "Find Buddy" button
2. Check **User console** for:
   ```
   [USER] Creating requests for 2 buddies: [...]
   [USER] Sending request to buddy: <name1> (<uuid1>)
   [USER] ✓ Request created successfully for <name1>
   [USER] Sending request to buddy: <name2> (<uuid2>)
   [USER] ✓ Request created successfully for <name2>
   [USER] Total requests created: 2/2
   ```

3. Check **Buddy 1 console** for:
   ```
   [BUDDY] New request received: {...}
   [BUDDY] Displaying request: <request_id>
   ```

4. Check **Buddy 2 console** for:
   ```
   [BUDDY] New request received: {...}
   [BUDDY] Displaying request: <request_id>
   ```

5. **Expected Result**: Both buddies see the request on their page

#### Test Scenario 2: First-Come-First-Served

1. After both buddies receive requests (from Scenario 1)
2. In **Buddy 1 window**, click "Accept" button
3. Check **Buddy 1 console** for:
   ```
   [BUDDY] Accepting request: <request_id>
   [BUDDY] Request accepted successfully: <request_id>
   ```

4. Check **Buddy 2 console** for:
   ```
   [BUDDY] Request updated: {...}
   ```
   - Note: Buddy 2's request should auto-hide (if they had the same request)

5. **Expected Result**: Buddy 1 accepts, Buddy 2's request disappears

#### Test Scenario 3: Decline and Next Request

1. Create another request from user window
2. In **Buddy 1 window**, click "Decline" button
3. Check **Buddy 1 console** for:
   ```
   [BUDDY] Declining request: <request_id>
   [BUDDY] Request declined successfully: <request_id>
   ```

4. **Expected Result**: Request is declined, buddy waits for next request

## Troubleshooting

### Issue: Buddies don't see requests

**Check 1: Real-time enabled?**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
Should show `buddy_requests` table.

**Check 2: Buddies authenticated?**
- Open buddy console
- Should see: `[BUDDY] Setting up real-time listener for buddy: <uuid>`
- If not, buddy is not logged in

**Check 3: Requests created?**
- Open debug dashboard: `http://localhost:3000/debug.html`
- Click "Check Requests"
- Should show recent requests with status "pending"

**Check 4: RLS policies blocking?**
- Check if `buddy_id` in requests matches logged-in buddy's UUID
- Verify policies in `create_buddy_requests_table.sql`

### Issue: Requests created but not visible

**Check 1: Console errors?**
- Look for Supabase errors in console
- Common: "permission denied" = RLS issue

**Check 2: Real-time subscription active?**
- Should see no errors after: `[BUDDY] Setting up real-time listener`
- If errors, real-time not enabled or network issue

**Check 3: Buddy available?**
- In debug dashboard, check "Available" column
- Should be ✅ Yes

### Issue: Multiple requests to same buddy

This is **expected behavior**. The system creates:
- **One request per buddy** (not one shared request)
- Each buddy gets their own request to accept/decline
- First to accept wins

### Issue: Buddy locations not updating

**Check 1: Location permissions?**
- Browser should ask for location permission
- Check browser settings

**Check 2: Location tracking active?**
- Console should show: `Initial buddy location updated`
- Check debug dashboard → "Location Updates" column

## Debug Endpoints

### GET /debug/buddies
Shows all buddies with availability and location status

### GET /debug/buddy-requests
Shows all requests with status and timestamps

### GET /debug/volunteers
Shows in-memory volunteer data (legacy)

### POST /request-help
Test finding nearby buddies
```json
{
  "lat": 45.4215,
  "lng": -75.6972,
  "radiusKm": 10
}
```

## Expected Console Output

### User Side (Creating Request)
```
[USER] Creating requests for 2 buddies: [{id: "...", name: "mamadou"}, {id: "...", name: "john"}]
[USER] Sending request to buddy: mamadou (abc-123-def)
[USER] ✓ Request created successfully for mamadou: {id: 1, ...}
[USER] Sending request to buddy: john (xyz-789-uvw)
[USER] ✓ Request created successfully for john: {id: 2, ...}
[USER] Total requests created: 2/2
```

### Buddy Side (Receiving Request)
```
[BUDDY] Setting up real-time listener for buddy: abc-123-def
[BUDDY] Checking for existing pending requests...
[BUDDY] Existing pending requests: []
[BUDDY] No existing requests found. Waiting for new requests...
[BUDDY] New request received: {id: 1, user_id: "...", buddy_id: "abc-123-def", ...}
[BUDDY] Displaying request: 1
```

### Buddy Side (Accepting Request)
```
[BUDDY] Accepting request: 1
[BUDDY] Request accepted successfully: 1
```

## Success Criteria

✅ All nearby buddies receive requests simultaneously  
✅ Each buddy sees request details on their page  
✅ First buddy to accept wins  
✅ Accepted/declined requests update in real-time  
✅ Console logs show complete flow  
✅ Debug dashboard shows all data correctly
