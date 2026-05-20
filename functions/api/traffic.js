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
      "I-270 and I-495, Bethesda, MD",
      "MacArthur Blvd and Clara Barton Pkwy, Bethesda, MD",
      "Chain Bridge, Washington, DC",
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

  if (!data.results || !data.results.length) {
    throw new Error("Could not geocode: " + address);
  }

  return data.results[0].position;
}

async function getRoute(route, key, home, office) {
  const points = [home];

  for (const waypoint of route.waypoints) {
    points.push(await geocode(waypoint, key));
  }

  points.push(office);

  const coordinateString = points
    .map(p => `${p.lat},${p.lon}`)
    .join(":");

  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/${coordinateString}/json` +
    `?key=${encodeURIComponent(key)}` +
    `&traffic=true` +
    `&travelMode=car` +
    `&routeType=fastest` +
    `&computeTravelTimeFor=all`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || !data.routes.length) {
    throw new Error("No route returned for " + route.label);
  }

  const summary = data.routes[0].summary;

  const minutes = Math.round(summary.travelTimeInSeconds / 60);
  const delay = Math.round((summary.trafficDelayInSeconds || 0) / 60);
  const miles =
    Math.round((summary.lengthInMeters / 1609.344) * 10) / 10;

  return {
    id: route.id,
    label: route.label,
    ok: true,
    minutes,
    delay,
    miles,
    timeLabel: `${minutes} min`,
    delayLabel:
      delay > 0
        ? `${delay} min traffic delay`
        : "No major traffic delay",
    distanceLabel: `${miles} mi`
  };
}

export async function onRequest(context) {
  const key = context.env.TOMTOM_API_KEY;

  if (!key) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Missing TOMTOM_API_KEY in Cloudflare."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const home = await geocode(HOME, key);
    const office = await geocode(OFFICE, key);

    const routes = await Promise.all(
      ROUTES.map(route => getRoute(route, key, home, office))
    );

    const bestRoute = [...routes].sort(
      (a, b) => a.minutes - b.minutes
    )[0];

    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: new Date().toISOString(),
        bestRouteId: bestRoute.id,
        bestRouteLabel: bestRoute.label,
        routes
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
