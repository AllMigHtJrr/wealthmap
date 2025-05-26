let map;
let highlightLayer;
let globalData = [];

function initMap() {
  map = L.map('map').setView([37.7749, -122.4194], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      globalData = data;

      data.forEach((owner, idx) => {
        const popupContent = `
          <b>${owner.name}</b><br>
          Property: ${owner.property}<br>
          Value: ${owner.value}<br>
          Net Worth: ${owner.net_worth}<br>
          <button class="show-area-btn" data-owner="${owner.name}" data-idx="${idx}">Show Owned Area</button>
        `;

        const marker = L.marker([owner.lat, owner.lng]).addTo(map).bindPopup(popupContent);

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.querySelector(`.show-area-btn[data-idx="${idx}"]`);
            if (btn) {
              btn.addEventListener('click', () => {
                highlightOwnedArea(owner.name, globalData);
              });
            }
          }, 100);
        });
      });
    })
    .catch(e => console.error("Error loading data.json:", e));
}

function highlightOwnedArea(ownerName, data) {
  if (highlightLayer) map.removeLayer(highlightLayer);

  const owner = data.find(o => o.name === ownerName);
  if (!owner || !owner.polygon || owner.polygon.length === 0) {
    alert(`No polygon data available for ${ownerName}`);
    return;
  }

  highlightLayer = L.polygon(owner.polygon, {
    color: 'blue',
    fillColor: 'lightblue',
    fillOpacity: 0.5,
    weight: 2,
  }).addTo(map);

  map.fitBounds(highlightLayer.getBounds());
}

// User session check
fetch('/user', { credentials: 'include' })
  .then(res => res.json())
  .then(user => {
    if (user.name) {
      document.getElementById("greeting").innerText = `Hi, ${user.name} 👋`;
      document.getElementById("getStarted").style.display = "inline-block";
      document.getElementById("loginButtons").style.display = "none";
    }
  });

document.getElementById("getStarted").addEventListener("click", () => {
  const video = document.getElementById("bg-video");
  const hero = document.getElementById("hero-section");
  const mapSection = document.getElementById("map-section");

  video.classList.add("zoom-out");

  setTimeout(() => {
    hero.style.display = "none";
    mapSection.classList.remove("hidden");
    initMap();
  }, 1500);
});

document.getElementById("searchBtn").addEventListener("click", () => {
  const input = document.getElementById("searchInput").value.trim().toLowerCase();
  const resultDiv = document.getElementById("searchResult");

  if (!input) {
    resultDiv.innerText = "Please enter an owner name.";
    return;
  }

  if (globalData.length === 0) {
    resultDiv.innerText = "Data not loaded yet.";
    return;
  }

  const owner = globalData.find(o => o.name.toLowerCase() === input);

  if (!owner) {
    resultDiv.innerText = `No owner found with the name "${input}".`;
  } else {
    resultDiv.innerHTML = `
      <b>Name:</b> ${owner.name}<br>
      <b>Property:</b> ${owner.property}<br>
      <b>Value:</b> ${owner.value}<br>
      <b>Net Worth:</b> ${owner.net_worth}
    `;
    highlightOwnedArea(owner.name, globalData);
  }
});

document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href = 'login.html';
});

document.getElementById("signupBtn").addEventListener("click", () => {
  window.location.href = 'register.html';
});

// --- NEW VISUALIZATION FEATURE ---

let ownerChart = null;

function showOwnerDetails(owner) {
  const panel = document.getElementById('ownerDetailsPanel');
  const contentDiv = document.getElementById('ownerDetailsContent');
  const ctx = document.getElementById('ownerPieChart').getContext('2d');

  contentDiv.innerHTML = `
    <b>Name:</b> ${owner.name} <br>
    <b>Property:</b> ${owner.property} <br>
    <b>Value:</b> $${Number(owner.value).toLocaleString()} <br>
    <b>Net Worth:</b> $${Number(owner.net_worth).toLocaleString()} <br>
  `;

  if (ownerChart) {
    ownerChart.destroy();
  }

  const propValue = Number(owner.value) || 0;
  const netWorth = Number(owner.net_worth) || 0;
  const remaining = netWorth > propValue ? netWorth - propValue : 0;

  ownerChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Property Value', 'Remaining Net Worth'],
      datasets: [{
        data: [propValue, remaining],
        backgroundColor: ['#36A2EB', '#FF6384'],
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: `${owner.name}'s Asset Breakdown`
        }
      }
    }
  });

  panel.style.display = 'block';
}

// Wrap original highlightOwnedArea to also show owner details panel
const originalHighlightOwnedArea = highlightOwnedArea;
highlightOwnedArea = function(ownerName, data) {
  originalHighlightOwnedArea(ownerName, data);

  const owner = data.find(o => o.name === ownerName);
  if (owner) {
    showOwnerDetails(owner);
  }
}

// Close button hides details and removes polygon highlight
document.getElementById('closeDetails').addEventListener('click', () => {
  document.getElementById('ownerDetailsPanel').style.display = 'none';

  if (highlightLayer) {
    map.removeLayer(highlightLayer);
    highlightLayer = null;
  }
});
