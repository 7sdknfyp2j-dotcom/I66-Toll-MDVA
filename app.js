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

async function fetchJson(url) {
  const response = await fetch(url + "?ts=" + Date.now(), { cache: "no-store" });
  return response.json();
}

function renderDashboard(tollData, trafficData) {
  const tolls = {};
  for (const route of tollData.routes || []) {
    tolls[route.id] = route;
  }

  const rows = (trafficData.routes || []).map(route => {
    const tollText =
      route.id === "chainbridge"
        ? "$0.00"
        : tolls[route.id]?.tollFormatted || "$0.00";

    return `
      <div class="card">
        <div class="card-title">${route.label}</div>
        <div class="card-price">${route.timeLabel || "Time unavailable"}</div>
        <div class="card-note">${route.distanceLabel || ""}</div>
        <div class="card-note">${route.delayLabel || ""}</div>
        <div class="card-note">Toll: ${tollText}</div>
      </div>
    `;
  }).join("");

  price.innerHTML = tollData.tollingActive
    ? "Tolling window active"
    : "No toll right now";

  statusEl.innerHTML = `
    <div>Updated ${localTime(trafficData.updatedAt || tollData.updatedAt)}</div>
    ${rows}
  `;
}

async function checkRoutes() {
  button.disabled = true;
  button.textContent = "Checking…";
  statusEl.textContent = "Getting route times and tolls…";
  statusEl.classList.remove("error");

  try {
    const [tollData, trafficData] = await Promise.all([
      fetchJson("/api/toll"),
      fetchJson("/api/traffic")
    ]);

    if (!tollData.ok) throw new Error(tollData.error || "Toll lookup failed.");
    if (!trafficData.ok) throw new Error(trafficData.error || "Traffic lookup failed.");

    renderDashboard(tollData, trafficData);
  } catch (err) {
    price.textContent = "—";
    statusEl.textContent = "Could not retrieve route data: " + err.message;
    statusEl.classList.add("error");
  } finally {
    button.disabled = false;
    button.textContent = "Check Routes Now";
  }
}

button.textContent = "Check Routes Now";
button.addEventListener("click", checkRoutes);
checkRoutes();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}
