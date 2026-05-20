const price = document.getElementById("price");
const statusEl = document.getElementById("status");
const button = document.getElementById("checkButton");

function localTime(iso) {
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
  button.textContent = "Checking…";
  price.textContent = "Checking tolls…";
  statusEl.textContent = "";

  try {
    const response = await fetch("/api/toll?ts=" + Date.now(), {
      cache: "no-store"
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Toll lookup failed.");
    }

    price.textContent = data.tollingActive
      ? "Tolling window active"
      : "No toll right now";

    const rows = data.routes.map(route => `
      <div class="card">
        <div class="card-title">${route.label}</div>
        <div class="card-price">${route.tollFormatted}</div>
        <div class="card-note">${route.message}</div>
      </div>
    `).join("");

    statusEl.innerHTML = `
      <div>Updated ${localTime(data.updatedAt)}</div>
      ${rows}
    `;
  } catch (err) {
    price.textContent = "—";
    statusEl.textContent = "Could not retrieve tolls: " + err.message;
  } finally {
    button.disabled = false;
    button.textContent = "Check Tolls Now";
  }
}

button.textContent = "Check Tolls Now";
button.addEventListener("click", checkTolls);
checkTolls();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
