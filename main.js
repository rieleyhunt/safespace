// Automatically update volunteer location
function startVolunteerAutoUpdate() {
  const id = document.getElementById("volId").value;
  const name = document.getElementById("volName").value;
  const available = document.getElementById("volAvailable").value === "true";
  if (!id || !name) return; // Require ID and name
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateVolunteerLocation(id, name, lat, lng, available);
      },
      function (error) {
        console.log("Unable to auto-update volunteer location:", error);
      },
      { enableHighAccuracy: true }
    );
  }
}

// Automatically update client location
function startClientAutoUpdate() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      function (position) {
        document.getElementById("clientLat").value = position.coords.latitude;
        document.getElementById("clientLng").value = position.coords.longitude;
      },
      function (error) {
        console.log("Unable to auto-update client location:", error);
      },
      { enableHighAccuracy: true }
    );
  }
}

// Start auto-update when volunteer form fields change
document
  .getElementById("volId")
  .addEventListener("change", startVolunteerAutoUpdate);
document
  .getElementById("volName")
  .addEventListener("change", startVolunteerAutoUpdate);
document
  .getElementById("volAvailable")
  .addEventListener("change", startVolunteerAutoUpdate);

// Start auto-update for client and auto-fill volunteer location on page load
window.addEventListener("DOMContentLoaded", function () {
  startClientAutoUpdate();
  // Also auto-fill volunteer location fields
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      document.getElementById("volLat").value = position.coords.latitude;
      document.getElementById("volLng").value = position.coords.longitude;
    });
  }
});
// Autofill volunteer location using Geolocation API
document.getElementById("volGeoBtn").addEventListener("click", function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        document.getElementById("volLat").value = position.coords.latitude;
        document.getElementById("volLng").value = position.coords.longitude;
      },
      function (error) {
        alert("Unable to retrieve your location.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// Autofill client location using Geolocation API
document.getElementById("clientGeoBtn").addEventListener("click", function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        document.getElementById("clientLat").value = position.coords.latitude;
        document.getElementById("clientLng").value = position.coords.longitude;
      },
      function (error) {
        alert("Unable to retrieve your location.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});
document.getElementById("btn").addEventListener("click", async () => {
  const response = await fetch("/button-clicked");
  const data = await response.json();
  console.log(data.message);
});

// Sample: Update volunteer location
async function updateVolunteerLocation(id, name, lat, lng, available = true) {
  const res = await fetch("/volunteer-location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name, lat, lng, available }),
  });
  // const data = await res.json();
}

// Client requests help and tracks progress
async function requestHelp(lat, lng, radiusKm = 5) {
  const res = await fetch("/request-help", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng, radiusKm }),
  });
  const data = await res.json();
  if (!data.success) {
    return;
  }
  // Defensive check for volunteer data
  if (!data.volunteer || !data.volunteer.name || !data.volunteer.id) {
    return;
  }
  // Track request progress
  trackRequestProgress(data.requestId);
}

// Poll for request status and show progress
function trackRequestProgress(requestId) {
  let interval = setInterval(async () => {
    const res = await fetch(`/request-status/${requestId}`);
    const data = await res.json();
    if (!data.success) {
      clearInterval(interval);
      return;
    }
    // Show status
    document.getElementById(
      "requestStatus"
    ).textContent = `Request status: ${data.status}`;
    if (
      data.status === "accepted" ||
      data.status === "declined" ||
      data.status === "completed"
    ) {
      clearInterval(interval);
    }
  }, 2000);
}

// Volunteer response handler
async function volunteerRespond(requestId, volunteerId, response) {
  const res = await fetch("/volunteer-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, volunteerId, response }),
  });
  // const data = await res.json();
}

// Volunteer form handler
document
  .getElementById("volunteerForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("volId").value;
    const name = document.getElementById("volName").value;
    const lat = parseFloat(document.getElementById("volLat").value);
    const lng = parseFloat(document.getElementById("volLng").value);
    const available = document.getElementById("volAvailable").value === "true";
    await updateVolunteerLocation(id, name, lat, lng, available);
    // ...no UI feedback for backend test...
  });

// Client form handler
document
  .getElementById("clientForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const lat = parseFloat(document.getElementById("clientLat").value);
    const lng = parseFloat(document.getElementById("clientLng").value);
    const radiusKm = parseFloat(document.getElementById("clientRadius").value);
    await requestHelp(lat, lng, radiusKm);
  });

// Volunteer response form handler (for demo)
document
  .getElementById("volunteerResponseForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const requestId = document.getElementById("responseRequestId").value;
    const volunteerId = document.getElementById("responseVolunteerId").value;
    const response = document.getElementById("responseAction").value;
    await volunteerRespond(requestId, volunteerId, response);
  });
