# Buddy Connection System - Setup & Testing Guide

## Overview
Real-time buddy connection system using Supabase Realtime for instant notifications between users and buddies.

## Setup Steps

### 1. Create Database Table
Run the SQL script in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard -> SQL Editor
# Copy and paste the contents of: create_buddy_requests_table.sql
# Click "Run" to execute
```

**Important:** The table includes Row Level Security (RLS) policies that ensure:
- Buddies can only see requests sent to them
- Users can only see their own requests
- Users can create requests
- Buddies can update request status (accept/decline)

### 2. Enable Realtime for the Table
In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Find `buddy_requests` table
3. Enable **Realtime** toggle
4. Click **Save**

This allows instant notifications when requests are created or updated.

### 3. Verify Database Connection
Ensure your `.env` file has correct credentials:
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

## How It Works

### User Flow (`user-index.html`)
1. User presses **"Find Buddy"** button
2. System finds nearest available buddy (within 5km radius)
3. Creates request record in `buddy_requests` table
4. Shows "Request sent, waiting for response..." message
5. **Real-time listener** waits for buddy's response
6. Shows "✓ Buddy accepted!" or "✗ Buddy declined" instantly

### Buddy Flow (`buddy-index.html`)
1. Buddy page loads with **real-time listener** active
2. When user sends request, buddy sees it **instantly** (no refresh needed)
3. Request appears in highlighted box with:
   - User location
   - Destination
   - Distance
   - Request time
4. Buddy clicks **"✓ Accept"** or **"✗ Decline"**
5. Status updates in database
6. User receives instant notification via real-time listener

## Testing Instructions

### Test 1: Basic Request Flow
1. Open two browser windows/tabs:
   - **Window 1:** Login as User → Navigate to `user-index.html`
   - **Window 2:** Login as Buddy → Navigate to `buddy-index.html`

2. In **Window 2 (Buddy)**:
   - Verify map loads with buddy location marker
   - Should see "No incoming requests at the moment"

3. In **Window 1 (User)**:
   - Enter destination address (optional)
   - Click **"Find Buddy"**
   - Should see: "🔍 Finding nearby buddy..."
   - Then: "📤 Request sent to [Buddy Name]. Waiting for response..."

4. In **Window 2 (Buddy)** - **INSTANT UPDATE**:
   - Request box appears automatically (no refresh!)
   - Shows user location, destination, distance
   - Map shows user marker and destination marker

5. In **Window 2 (Buddy)**, click **"✓ Accept"**:
   - Request disappears
   - Shows "✓ Request accepted! Connection established."

6. In **Window 1 (User)** - **INSTANT UPDATE**:
   - Shows "✓ Buddy accepted your request! Connection established."

### Test 2: Decline Flow
Repeat Test 1, but buddy clicks **"✗ Decline"** instead:
- User sees: "✗ Buddy declined your request. Try another buddy."
- Buddy sees: "Request declined. Waiting for new requests..."

### Test 3: Multiple Requests
1. User sends request
2. Before buddy responds, user can send another request (will replace previous)
3. Buddy only sees most recent pending request

## Troubleshooting

### Request not appearing for buddy?
1. Check Supabase Dashboard → Database → `buddy_requests` table
2. Verify request was created with correct `buddy_id`
3. Ensure Realtime is enabled for the table
4. Check browser console for errors

### Real-time not working?
1. Open browser DevTools → Console
2. Look for "New request received:" or "Request status updated:" logs
3. Verify Supabase Realtime is enabled in Dashboard
4. Check RLS policies allow the operation

### "No buddy found nearby"?
1. Ensure buddy has location tracking enabled
2. Check `buddy_live_locations` table has recent entries
3. Verify buddy `available` status is `true` in `buddies` table
4. Try increasing radius in code (currently 5km)

## Database Schema

```sql
buddy_requests
├── id (SERIAL PRIMARY KEY)
├── user_id (UUID) - References auth.users
├── buddy_id (UUID) - References auth.users
├── status (VARCHAR) - 'pending' | 'accepted' | 'declined'
├── user_lat (DECIMAL)
├── user_lon (DECIMAL)
├── destination (TEXT)
├── destination_lat (DECIMAL)
├── destination_lon (DECIMAL)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Key Features

✅ **Real-time notifications** - No polling, instant updates
✅ **Simple UI** - Clear status messages and visual feedback
✅ **Distance calculation** - Shows how far buddy is from user
✅ **Map visualization** - All parties shown on map
✅ **Secure** - RLS policies protect data access
✅ **Single request** - One active request at a time (can extend later)

## Next Steps (Future Enhancements)

- [ ] Support multiple simultaneous requests
- [ ] Add request expiry (auto-decline after 5 minutes)
- [ ] Show buddy profile info in request
- [ ] Add chat functionality after connection
- [ ] Track connection status (in-progress, completed)
- [ ] Add notification sound for incoming requests
- [ ] Show route on map after acceptance

## Files Modified

1. `create_buddy_requests_table.sql` - Database schema
2. `user-index.html` - User page with request creation & real-time listener
3. `buddy-index.html` - Buddy page with request display & accept/decline
4. `main.js` - Updated Find Buddy button logic

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check database records in Supabase Dashboard
4. Ensure both users are authenticated
