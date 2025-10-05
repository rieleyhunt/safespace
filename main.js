// Google Maps: Show client, volunteer, and destination markers
function initMap() {
  // Show weather info for client location
  function showWeather(lat, lng) {
    const apiKey = "8f99f22d56a8b53275cd55ef11807b56";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        let weatherDiv = document.getElementById("weather");
        if (!weatherDiv) {
          weatherDiv = document.createElement("div");
          weatherDiv.id = "weather";
          weatherDiv.style.marginTop = "10px";
          weatherDiv.style.fontWeight = "bold";
          document.getElementById("map").parentNode.appendChild(weatherDiv);
        }
        weatherDiv.innerHTML = `<strong>Weather:</strong> ${data.weather[0].description}<br><strong>Temperature:</strong> ${data.main.temp}°C`;
      })
      .catch(() => {
        let weatherDiv = document.getElementById("weather");
        if (!weatherDiv) {
          weatherDiv = document.createElement("div");
          weatherDiv.id = "weather";
          weatherDiv.style.marginTop = "10px";
          weatherDiv.style.fontWeight = "bold";
          document.getElementById("map").parentNode.appendChild(weatherDiv);
        }
        weatherDiv.innerHTML = "Weather info unavailable.";
      });
  }
  // Sample coordinates (replace with real data from backend)
  // TODO: Replace with real coordinates from backend
  // Get client location from browser
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const clientLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      showWeather(clientLocation.lat, clientLocation.lng);
      const volunteerLocation = { lat: 45.3468, lng: -75.7146 };
      const destination = { lat: 45.3468, lng: -75.73 };

      const map = new google.maps.Map(document.getElementById("map"), {
        center: clientLocation,
        zoom: 15,
      });

      // Safety Zone Overlay (circle around client)
      const safetyZone = new google.maps.Circle({
        strokeColor: "#00ff00",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#00ff00",
        fillOpacity: 0.2,
        map,
        center: clientLocation,
        radius: 300, // meters
      });

      // Markers
      // Custom SVG icons for visually appealing markers
      const clientIcon = {
        url: "data:image/svg+xml;utf8,<svg width='32' height='32' xmlns='http://www.w3.org/2000/svg'><circle cx='16' cy='16' r='12' fill='%23007bff' stroke='white' stroke-width='3'/><text x='16' y='21' font-size='14' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>C</text></svg>",
        scaledSize: new google.maps.Size(32, 32),
      };
      const volunteerIcon = {
        url: "data:image/svg+xml;utf8,<svg width='32' height='32' xmlns='http://www.w3.org/2000/svg'><circle cx='16' cy='16' r='12' fill='%2300c853' stroke='white' stroke-width='3'/><text x='16' y='21' font-size='14' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>V</text></svg>",
        scaledSize: new google.maps.Size(32, 32),
      };
      const destinationIcon = {
        url: "data:image/svg+xml;utf8,<svg width='32' height='32' xmlns='http://www.w3.org/2000/svg'><circle cx='16' cy='16' r='12' fill='%23d50000' stroke='white' stroke-width='3'/><text x='16' y='21' font-size='14' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>D</text></svg>",
        scaledSize: new google.maps.Size(32, 32),
      };
      new google.maps.Marker({
        position: clientLocation,
        map,
        title: "Client Location",
        icon: clientIcon,
      });
      new google.maps.Marker({
        position: volunteerLocation,
        map,
        title: "Volunteer Location",
        icon: volunteerIcon,
      });
      new google.maps.Marker({
        position: destination,
        map,
        title: "Destination",
        icon: destinationIcon,
      });

      // Routing: volunteer -> client -> destination
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
      });
      directionsRenderer.setMap(map);

      const waypoints = [
        {
          location: clientLocation,
          stopover: true,
        },
      ];

      directionsService.route(
        {
          origin: volunteerLocation,
          destination: destination,
          waypoints: waypoints,
          travelMode: google.maps.TravelMode.WALKING,
        },
        function (response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
            // Show ETA (duration) for the route
            const route = response.routes[0];
            let etaText = "";
            if (route.legs && route.legs.length > 0) {
              // Sum durations for all legs (volunteer->client, client->destination)
              let totalSeconds = 0;
              route.legs.forEach((leg) => {
                if (leg.duration) totalSeconds += leg.duration.value;
              });
              const minutes = Math.round(totalSeconds / 60);
              etaText = `Estimated arrival time: ${minutes} min`;
            }
            // Display ETA below the map
            let etaDiv = document.getElementById("eta");
            if (!etaDiv) {
              etaDiv = document.createElement("div");
              etaDiv.id = "eta";
              etaDiv.style.marginTop = "10px";
              etaDiv.style.fontWeight = "bold";
              document.getElementById("map").parentNode.appendChild(etaDiv);
            }
            etaDiv.textContent = etaText;
          } else {
            console.error("Directions request failed due to " + status);
          }
        }
      );
    });
  } else {
    // Fallback: use sample data if geolocation is not available
    const clientLocation = { lat: 40.7128, lng: -74.006 };
    showWeather(clientLocation.lat, clientLocation.lng);
    const volunteerLocation = { lat: 40.7135, lng: -74.0055 };
    const destination = { lat: 40.715, lng: -74.004 };
    const map = new google.maps.Map(document.getElementById("map"), {
      center: clientLocation,
      zoom: 15,
    });
    // Safety Zone Overlay (circle around client)
    const safetyZone = new google.maps.Circle({
      strokeColor: "#00ff00",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#00ff00",
      fillOpacity: 0.2,
      map,
      center: clientLocation,
      radius: 300, // meters
    });
    // Markers
    // Custom SVG icons for visually appealing markers
    const clientIcon = {
      url: "data:image/svg+xml;utf8,<svg width='32' height='32' xmlns='http://www.w3.org/2000/svg'><circle cx='16' cy='16' r='12' fill='%23007bff' stroke='white' stroke-width='3'/><text x='16' y='21' font-size='14' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>C</text></svg>",
      scaledSize: new google.maps.Size(32, 32),
    };
    const volunteerIcon = {
      url: "data:image/svg+xml;utf8,<svg width='32' height='32' xmlns='http://www.w3.org/2000/svg'><circle cx='16' cy='16' r='12' fill='%2300c853' stroke='white' stroke-width='3'/><text x='16' y='21' font-size='14' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>V</text></svg>",
      scaledSize: new google.maps.Size(32, 32),
    };
    const destinationIcon = {
      url: "data:image/svg+xml;utf8,<svg width='32' height='32' xmlns='http://www.w3.org/2000/svg'><circle cx='16' cy='16' r='12' fill='%23d50000' stroke='white' stroke-width='3'/><text x='16' y='21' font-size='14' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>D</text></svg>",
      scaledSize: new google.maps.Size(32, 32),
    };
    new google.maps.Marker({
      position: clientLocation,
      map,
      title: "Client Location",
      icon: clientIcon,
    });
    new google.maps.Marker({
      position: volunteerLocation,
      map,
      title: "Volunteer Location",
      icon: volunteerIcon,
    });
    new google.maps.Marker({
      position: destination,
      map,
      title: "Destination",
      icon: destinationIcon,
    });
    // Routing: volunteer -> client -> destination
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
    });
    directionsRenderer.setMap(map);

    const waypoints = [
      {
        location: clientLocation,
        stopover: true,
      },
    ];

    directionsService.route(
      {
        origin: volunteerLocation,
        destination: destination,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.WALKING,
      },
      function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(response);
          // Show ETA (duration) for the route
          const route = response.routes[0];
          let etaText = "";
          if (route.legs && route.legs.length > 0) {
            // Sum durations for all legs (volunteer->client, client->destination)
            let totalSeconds = 0;
            route.legs.forEach((leg) => {
              if (leg.duration) totalSeconds += leg.duration.value;
            });
            const minutes = Math.round(totalSeconds / 60);
            etaText = `Estimated arrival time: ${minutes} min`;
          }
          // Display ETA below the map
          let etaDiv = document.getElementById("eta");
          if (!etaDiv) {
            etaDiv = document.createElement("div");
            etaDiv.id = "eta";
            etaDiv.style.marginTop = "10px";
            etaDiv.style.fontWeight = "bold";
            document.getElementById("map").parentNode.appendChild(etaDiv);
          }
          etaDiv.textContent = etaText;
        } else {
          console.error("Directions request failed due to " + status);
        }
      }
    );
  }
}
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
const volId = document.getElementById("volId");
if (volId) volId.addEventListener("change", startVolunteerAutoUpdate);
const volName = document.getElementById("volName");
if (volName) volName.addEventListener("change", startVolunteerAutoUpdate);
const volAvailable = document.getElementById("volAvailable");
if (volAvailable)
  volAvailable.addEventListener("change", startVolunteerAutoUpdate);

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
