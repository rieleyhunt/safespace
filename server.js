const express = require("express");
const app = express();
const PORT = 3000;

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
app.post("/request-help", (req, res) => {
  const { lat, lng, radiusKm = 5 } = req.body;
  // Find available volunteers within radius
  const nearby = volunteers.filter(
    (v) => v.available && getDistance(lat, lng, v.lat, v.lng) <= radiusKm
  );
  if (nearby.length === 0) {
    return res.json({
      success: false,
      message: "No volunteers available nearby.",
    });
  }
  // Auto-assign closest volunteer
  let closest = nearby[0];
  let minDist = getDistance(lat, lng, closest.lat, closest.lng);
  for (let v of nearby) {
    const dist = getDistance(lat, lng, v.lat, v.lng);
    if (dist < minDist) {
      closest = v;
      minDist = dist;
    }
  }
  // Mark volunteer as busy
  const vIdx = volunteers.findIndex((v) => v.id === closest.id);
  if (vIdx > -1) volunteers[vIdx].available = false;
  // Create request
  const reqId = "req_" + Date.now();
  requests.push({
    id: reqId,
    clientLat: lat,
    clientLng: lng,
    volunteerId: closest.id,
    status: "pending",
  });
  res.json({ success: true, requestId: reqId, volunteer: closest });
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
  console.log(`Server is running on http://localhost:${PORT}`);
});
