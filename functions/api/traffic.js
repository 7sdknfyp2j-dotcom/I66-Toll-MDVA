const TOMTOM_API_KEY = env => env.TOMTOM_API_KEY;

const HOME = "1490 Selworthy Rd, Rockville, MD 20854";
const OFFICE = "1010 N Glebe Rd, Arlington, VA 22201";

const ROUTES = [
  {
    id: "fairfax",
    label: "I-66 → Fairfax Drive",
    waypoints: [
      "Route 267 and I-66, Falls Church, VA",
      "Fairfax Drive and N Glebe Rd, Arlington, VA"
    ]
  },
  {
    id: "washington",
    label: "I-66 → Washington Blvd",
    waypoints: [
      "Route 267 and I-66, Falls Church, VA",
      "Washington Blvd and I-66, Arlington, VA",
      "Washington Blvd and N Glebe Rd, Arlington, VA"
    ]
  },
  {
    id: "chainbridge",
    label: "No toll via Chain Bridge",
    waypoints: [
      "I-270 S and I-495, Bethesda, MD",
      "Clara Barton Parkway, Bethesda, MD",
      "Chain Bridge Rd NW, Washington, DC",
      "N Glebe Rd and Chain Bridge Rd, Arlington, VA"
    ]
  }
];

async function geocode(address, key) {
  const url =
    "https://api.tomtom.com/search/2/geocode/" +
    encodeURIComponent(address) +
    ".json?key=" +
    encodeURIComponent(key) +
    "&limit=1";

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || !data.results[0]) {
    throw new Error("Could not geocode: " + address);
  }

  return data.results[0].position;
}

async function getRoute(route, key, home, office) {
  const waypointCoords = [];

  for (const waypoint of route.waypoints) {
    waypointCoords.push(await geocode(waypoint, key));
  }

  const allPoints = [home, ...waypointCoords, office]
    .map(p => `${p.lat},${p.lon}`)
    .join(":");

  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/${allPoints}/json` +
    `?key=${encodeURIComponent(key)}` +
    `&traffic=true` +
    `&travelMode=car` +
    `&routeType=fastest` +
    `&computeTravelTimeFor=all`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || !data.routes[0]) {
    return {
      ...route,
      ok: false,
      error: data.error?.description || "No route returned"
    };
  }

  const summary = data.routes[0].summary;
  const minutes = Math.round(summary.travelTimeInSeconds / 60);
  const delay = Math.round((summary.trafficDelayInSeconds || 0) / 60);
  const miles = Math.round((summary.lengthInMeters / 1609.344) * 10) / 10;

  return {
    ...route,
    ok: true,
    minutes,
    delay,
    miles,
    timeLabel: `${minutes} min`,
    delayLabel: delay > 0 ? `${delay} min traffic delay` : "No major traffic delay",
    distanceLabel: `${miles} mi`
  };
}

export async function onRequest(context) {
  const key = TOMTOM_API_KEY(context.env);

  if (!key) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Missing TOMTOM_API_KEY in Cloudflare."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const home = await geocode(HOME, key);
    const office = await geocode(OFFICE, key);

    const routes = await Promise.all(
      ROUTES.map(route => getRoute(route, key, home, office))
    );

    const validRoutes = routes.filter(r => r.ok);
    const best = validRoutes.sort((a, b) => a.minutes - b.minutes)[0];

    return new Response(JSON.stringify({
      ok: true,
      updatedAt: new Date().toISOString(),
      bestRouteId: best?.id || null,
      bestRouteLabel: best?.label || null,
      routes
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
