const price = document.getElementById("price");

const statusEl = document.getElementById("status");

const button = document.getElementById("checkButton");

function formatTime(iso) {

  try {

    return new Date(iso).toLocaleString([], {

      month: "short",

      day: "numeric",

      hour: "numeric",

      minute: "2-digit"

    });

  } catch {

    return "";

  }

}

async function checkTolls() {

  button.disabled = true;

  button.textContent = "Checking Tolls...";

  price.textContent = "Loading...";

  statusEl.innerHTML = "";

  try {

    const response = await fetch("/api/toll?ts=" + Date.now(), {

      cache: "no-store"

    });

    const data = await response.json();

    if (!data.ok) {

      throw new Error(data.error || "Unable to retrieve tolls.");

    }

    // Main header text

    price.textContent = data.tollingActive

      ? "Tolling Window Active"

      : "No Toll Right Now";

    // Build route cards

    const cards = data.routes.map(route => `

      <div class="card">

        <div class="card-title">${route.label}</div>

        <div class="card-price">${route.tollFormatted}</div>

        <div class="card-note">${route.message}</div>

      </div>

    `).join("");

    statusEl.innerHTML = `

      <div style="margin-bottom: 16px;">

        Updated ${formatTime(data.updatedAt)}

      </div>

      ${cards}

    `;

  } catch (error) {

    price.textContent = "—";

    statusEl.textContent =

      "Could not retrieve tolls: " + error.message;

  } finally {

    button.disabled = false;

    button.textContent = "Check Tolls Now";

  }

}

// Set button text and click handler

button.textContent = "Check Tolls Now";

button.addEventListener("click", checkTolls);

// Load automatically when page opens

checkTolls();

// Disable all service workers to avoid stale cache issues

if ("serviceWorker" in navigator) {

  navigator.serviceWorker.getRegistrations().then(registrations => {

    for (const registration of registrations) {

      registration.unregister();

    }

  });

}
