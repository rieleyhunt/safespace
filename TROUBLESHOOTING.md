# Troubleshooting: Buddy Not Receiving Requests

## Current Situation
- ✅ Server finds buddy: `Found 1 nearby buddies. Closest: Mama at 0.00km`
- ❌ Buddy doesn't receive request on frontend
- ✅ Real-time is enabled (confirmed by error message)

## Step-by-Step Diagnosis

### Step 1: Check User Browser Console

Open the **user page** (user-index.html) and press **F12** to open console.

**Look for these logs:**
```
[USER] User authenticated: <uuid>
[USER] Creating requests for 1 buddies: [...]
[USER] Sending request to buddy: Mama (<uuid>)
[USER] Creating request with: {...}
[USER] Request created in database: {...}
[USER] ✓ Request created successfully for Mama
[USER] Total requests created: 1/1
```

**If you DON'T see these logs:**
- The user might not be authenticated
- The `createBuddyRequest` function might not be defined
- Check for JavaScript errors in console

**If you see an error:**
- Copy the exact error message
- It might be an RLS policy issue or authentication issue

### Step 2: Check Buddy Browser Console

Open the **buddy page** (buddy-index.html) and press **F12** to open console.

**Look for these logs:**
```
[BUDDY] Setting up real-time listener for buddy: <uuid>
[BUDDY] Checking for existing pending requests...
[BUDDY] Existing pending requests: []
[BUDDY] No existing requests found. Waiting for new requests...
```

When a request is created, you should see:
```
[BUDDY] New request received: {id: X, user_id: "...", buddy_id: "...", ...}
[BUDDY] Displaying request: X
```

**If you DON'T see "New request received":**
- Real-time subscription might have failed
- The buddy_id in the request doesn't match the logged-in buddy's UUID
- Check for any errors after the "Setting up real-time listener" message

### Step 3: Verify Data in Database

Open debug dashboard: `http://localhost:3000/debug.html`

1. Click **"Check Requests"**
   - You should see recent requests with status "pending"
   - Check if the `buddy_id` matches the buddy's UUID

2. Click **"Check Buddies"**
   - Verify the buddy exists
   - Check if `available` is `true`
   - Note the buddy's UUID

3. Compare the UUIDs:
   - Request `buddy_id` should match buddy's `id`
   - If they don't match, the buddy won't receive the request

### Step 4: Check Real-time Subscription

In the **buddy console**, after you see:
```
[BUDDY] Setting up real-time listener for buddy: <uuid>
```

Check if there are any errors immediately after. Common errors:
- `"Realtime is not enabled for this table"`
- `"Permission denied"`
- `"Invalid filter"`

### Step 5: Manual Test

Run this in the **buddy console**:
```javascript
console.log('Current Buddy ID:', currentBuddyId);
```

Then run this in **Supabase SQL Editor**:
```sql
SELECT 
  br.id,
  br.buddy_id,
  b.name as buddy_name,
  br.status,
  br.created_at
FROM buddy_requests br
LEFT JOIN buddies b ON b.id = br.buddy_id
ORDER BY br.created_at DESC
LIMIT 3;
```

Compare the `buddy_id` from the SQL result with the `currentBuddyId` from the console.

## Common Issues & Fixes

### Issue 1: User Not Authenticated
**Symptom:** No `[USER]` logs in user console

**Fix:**
1. Refresh user page
2. Check if user is logged in
3. Look for authentication errors

### Issue 2: Buddy Not Authenticated
**Symptom:** No `[BUDDY]` logs in buddy console

**Fix:**
1. Refresh buddy page
2. Check if buddy is logged in
3. Verify buddy exists in database

### Issue 3: UUID Mismatch
**Symptom:** Request created but buddy doesn't receive it

**Fix:**
1. Check debug dashboard
2. Compare `buddy_id` in request with buddy's actual UUID
3. Ensure the buddy being found by the server has the correct UUID

### Issue 4: RLS Policy Blocking
**Symptom:** Request created but error in console

**Fix:**
Run this SQL to check policies:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'buddy_requests';
```

Ensure these policies exist:
- "Buddies can view their requests" - FOR SELECT USING (auth.uid() = buddy_id)
- "Users can create requests" - FOR INSERT WITH CHECK (auth.uid() = user_id)

### Issue 5: Real-time Filter Wrong
**Symptom:** Subscription active but no events received

**Fix:**
Check the filter in buddy-index.html line 192:
```javascript
filter: `buddy_id=eq.${currentBuddyId}`
```

Make sure `currentBuddyId` is not null/undefined.

## What to Report

Please provide:

1. **User Console Output** (copy/paste all `[USER]` logs)
2. **Buddy Console Output** (copy/paste all `[BUDDY]` logs)
3. **Any Errors** (red text in console)
4. **Debug Dashboard Results** (screenshot or copy/paste)

This will help identify the exact issue!
