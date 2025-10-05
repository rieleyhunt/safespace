require("dotenv").config();
const express = require("express");
const { pool, checkDatabaseConnection } = require("./db");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// In-memory volunteers list (for demo)
let volunteers = [
  // Example: { id: 'vol1', name: 'Alice', lat: 40.7128, lng: -74.0060, available: true }
];

// In-memory requests list
let requests = [
  // Example: { id: 'req1', clientLat, clientLng, volunteerId, status: 'pending'|'accepted'|'declined'|'completed' }
];

// ===== AUTH NOTE =====
// Authentication is now handled entirely by Supabase on the frontend
// No backend auth endpoints needed

// ===== VOLUNTEER & REQUEST ENDPOINTS =====
// Get buddy availability
app.get("/api/buddy/:id/availability", async (req, res) => {
  const buddyId = req.params.id;
  try {
    const result = await pool.query(
      "SELECT available FROM buddies WHERE id = $1",
      [buddyId]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Buddy not found." });
    }
    res.json({ success: true, available: result.rows[0].available });
  } catch (err) {
    console.error("DB error in GET /api/buddy/:id/availability:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Toggle buddy availability
app.post("/api/buddy/:id/toggle-availability", async (req, res) => {
  const buddyId = req.params.id;
  try {
    // Get current availability
    const result = await pool.query(
      "SELECT available FROM buddies WHERE id = $1",
      [buddyId]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Buddy not found." });
    }
    const current = result.rows[0].available;
    const newValue = !current;
    await pool.query("UPDATE buddies SET available = $1 WHERE id = $2", [
      newValue,
      buddyId,
    ]);
    res.json({ success: true, available: newValue });
  } catch (err) {
    console.error("DB error in POST /api/buddy/:id/toggle-availability:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
// Endpoint for users to update their live location
app.post("/user-location", async (req, res) => {
  const { user_id, lat, lon } = req.body;
  if (!user_id || lat == null || lon == null) {
    return res
      .status(400)
      .json({ success: false, message: "Missing user_id, lat, or lon." });
  }
  try {
    // Insert new location entry
    await pool.query(
      `INSERT INTO user_live_locations (user_id, lat, lon, updated_at)
       VALUES ($1, $2, $3, NOW())`,
      [user_id, lat, lon]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB error in /user-location:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Endpoint for volunteers/buddies to update their location
app.post("/volunteer-location", async (req, res) => {
  const { id, name, lat, lng, available } = req.body;
  
  if (!id || lat == null || lng == null) {
    return res
      .status(400)
      .json({ success: false, message: "Missing id, lat, or lng." });
  }
  
  try {
    // Insert new location entry into buddy_live_locations table
    await pool.query(
      `INSERT INTO buddy_live_locations (buddy_id, lat, lon, updated_at)
       VALUES ($1, $2, $3, NOW())`,
      [id, lat, lng]
    );
    
    // Also update in-memory array for backwards compatibility
    const idx = volunteers.findIndex((v) => v.id === id);
    if (idx > -1) {
      volunteers[idx] = { id, name, lat, lng, available };
    } else {
      volunteers.push({ id, name, lat, lng, available });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("DB error in /volunteer-location:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Debug endpoint to see available buddies
app.get("/debug/volunteers", (req, res) => {
  res.json({ 
    count: volunteers.length,
    volunteers: volunteers 
  });
});

// Simple distance function (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  function toRad(x) {
    return (x * Math.PI) / 180;
  }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// DATABASE-BASED Matching endpoint: Queries buddy_live_locations and returns ALL nearby buddies
// This works in production even after server restarts
app.post("/request-help", async (req, res) => {
  const { lat, lng, radiusKm = 5 } = req.body;
  
  console.log(`[MATCH] Request from (${lat}, ${lng}) with radius ${radiusKm}km`);
  
  try {
    // Query database for recent buddy locations (within last 5 minutes)
    // Get the most recent location for each buddy
    const result = await pool.query(`
      SELECT DISTINCT ON (bll.buddy_id) 
        bll.buddy_id as id,
        b.name,
        bll.lat,
        bll.lon,
        b.available,
        bll.updated_at
      FROM buddy_live_locations bll
      INNER JOIN buddies b ON b.id = bll.buddy_id
      WHERE b.available = true
        AND bll.updated_at > NOW() - INTERVAL '5 minutes'
      ORDER BY bll.buddy_id, bll.updated_at DESC
    `);
    
    const availableBuddies = result.rows;
    console.log(`[MATCH] Available buddies in database:`, availableBuddies.length);
    
    if (availableBuddies.length === 0) {
      return res.json({
        success: false,
        message: "No volunteers available. Please ensure buddies are online and have shared their location.",
      });
    }
    
    // Filter by radius and calculate distances
    const nearby = [];
    for (const buddy of availableBuddies) {
      const dist = getDistance(lat, lng, parseFloat(buddy.lat), parseFloat(buddy.lon));
      if (dist <= radiusKm) {
        nearby.push({
          id: buddy.id,
          name: buddy.name,
          lat: parseFloat(buddy.lat),
          lon: parseFloat(buddy.lon),
          distance: dist
        });
      }
    }
    
    console.log(`[MATCH] Nearby buddies within ${radiusKm}km:`, nearby.length);
    
    if (nearby.length === 0) {
      return res.json({
        success: false,
        message: `No volunteers available within ${radiusKm}km. Try increasing the search radius.`,
      });
    }
    
    // Sort by distance (closest first)
    nearby.sort((a, b) => a.distance - b.distance);
    
    console.log(`[MATCH] Found ${nearby.length} nearby buddies. Closest: ${nearby[0].name} at ${nearby[0].distance.toFixed(2)}km`);
    
    // Return ALL nearby buddies (not just the closest)
    res.json({ 
      success: true,
      buddies: nearby,
      count: nearby.length,
      // For backwards compatibility, also return the closest as "volunteer"
      volunteer: nearby[0]
    });
    
  } catch (err) {
    console.error("DB error in /request-help:", err);
    res.status(500).json({ success: false, message: "Server error while finding buddies." });
  }
});

// Volunteer response endpoint (accept/decline)
app.post("/volunteer-response", (req, res) => {
  const { requestId, volunteerId, response } = req.body; // response: 'accepted' or 'declined'
  const reqIdx = requests.findIndex(
    (r) => r.id === requestId && r.volunteerId === volunteerId
  );
  if (reqIdx === -1)
    return res
      .status(404)
      .json({ success: false, message: "Request not found." });
  if (response === "accepted") {
    requests[reqIdx].status = "accepted";
  } else if (response === "declined") {
    requests[reqIdx].status = "declined";
    // Mark volunteer as available again
    const vIdx = volunteers.findIndex((v) => v.id === volunteerId);
    if (vIdx > -1) volunteers[vIdx].available = true;
  }
  res.json({ success: true, status: requests[reqIdx].status });
});

// Complete request endpoint
app.post("/complete-request", (req, res) => {
  const { requestId } = req.body;
  const reqIdx = requests.findIndex((r) => r.id === requestId);
  if (reqIdx === -1)
    return res
      .status(404)
      .json({ success: false, message: "Request not found." });
  requests[reqIdx].status = "completed";
  // Mark volunteer as available again
  const vId = requests[reqIdx].volunteerId;
  const vIdx = volunteers.findIndex((v) => v.id === vId);
  if (vIdx > -1) volunteers[vIdx].available = true;
  res.json({ success: true, status: "completed" });
});

// Endpoint to get request progress/status
app.get("/request-status/:requestId", (req, res) => {
  const { requestId } = req.params;
  const reqObj = requests.find((r) => r.id === requestId);
  if (!reqObj)
    return res
      .status(404)
      .json({ success: false, message: "Request not found." });
  res.json({
    success: true,
    status: reqObj.status,
    volunteerId: reqObj.volunteerId,
  });
});

app.get("/button-clicked", (req, res) => {
  res.json({ message: "button was clicked!" });
  console.log("Button click received");
});

app.listen(PORT, () => {
  checkDatabaseConnection();
  console.log(`Server is running on http://localhost:${PORT}`);
});
