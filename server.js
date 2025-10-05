require("dotenv").config();
const express = require("express");
const { checkDatabaseConnection } = require("./db");
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

// Endpoint for volunteers to update their location (for demo/testing)
app.post("/volunteer-location", (req, res) => {
  const { id, name, lat, lng, available } = req.body;
  // Update or add volunteer
  const idx = volunteers.findIndex((v) => v.id === id);
  if (idx > -1) {
    volunteers[idx] = { id, name, lat, lng, available };
  } else {
    volunteers.push({ id, name, lat, lng, available });
  }
  res.json({ success: true });
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

// Matching endpoint: client requests help, auto-assign closest volunteer
const { pool } = require("./db");
app.post("/request-help", async (req, res) => {
  const { lat, lng, radiusKm = 5 } = req.body;
  try {
    // Get all available buddies and their latest location
    const buddiesQuery = `
      SELECT b.id, b.name, b.email, b.address, b.available, bl.lat, bl.lon
      FROM buddies b
      JOIN LATERAL (
        SELECT lat, lon
        FROM buddy_live_locations
        WHERE buddy_id = b.id
        ORDER BY updated_at DESC
        LIMIT 1
      ) bl ON true
      WHERE b.available = true
    `;
    const { rows: buddies } = await pool.query(buddiesQuery);
    // Filter by radius
    const nearby = buddies.filter(
      (buddy) => getDistance(lat, lng, buddy.lat, buddy.lon) <= radiusKm
    );
    if (nearby.length === 0) {
      return res.json({
        success: false,
        message: "No volunteers available nearby.",
      });
    }
    // Find closest
    let closest = nearby[0];
    let minDist = getDistance(lat, lng, closest.lat, closest.lon);
    for (let b of nearby) {
      const dist = getDistance(lat, lng, b.lat, b.lon);
      if (dist < minDist) {
        closest = b;
        minDist = dist;
      }
    }
    // Mark buddy as unavailable
    await pool.query("UPDATE buddies SET available = false WHERE id = $1", [
      closest.id,
    ]);
    // Create request (optional: store in DB)
    const reqId = "req_" + Date.now();
    requests.push({
      id: reqId,
      clientLat: lat,
      clientLng: lng,
      volunteerId: closest.id,
      status: "pending",
    });
    res.json({ success: true, requestId: reqId, volunteer: closest });
  } catch (err) {
    console.error("DB error in /request-help:", err);
    res.status(500).json({ success: false, message: "Server error." });
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
