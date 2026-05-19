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

function renderRoutes(data) {
  const rows = (data.routes || []).map(route => `
    <div class="card">
      <div class="card-title">${route.label}</div>
      <div class="card-price">${route.tollFormatted}</div>
      <div class="card-note">${route.message || ""}</div>
    </div>
  `).join("");

  price.innerHTML = data.tollingActive
    ? "Morning tolling window is active"
    : "No toll right now";

  statusEl.innerHTML = `
    <div>Updated ${localTime(data.updatedAt)}</div>
    ${rows}
  `;
}

async function checkToll() {
  button.disabled = true;
  button.textContent = "Checking…";
  statusEl.textContent = "Getting the latest toll estimates…";
  statusEl.classList.remove("error");

  try {
    const response = await fetch("/api/toll?ts=" + Date.now(), {
      cache: "no-store"
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Unable to retrieve tolls.");
    }

    renderRoutes(data);
  } catch (err) {
    price.textContent = "—";
    statusEl.textContent = "Could not retrieve tolls: " + err.message;
    statusEl.classList.add("error");
  } finally {
    button.disabled = false;
    button.textContent = "Check Tolls Now";
  }
}

button.addEventListener("click", checkToll);
checkToll();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}