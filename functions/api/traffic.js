const HOME = { lat: 39.06562, lon: -77.18964 };
const OFFICE = { lat: 38.88323, lon: -77.11638 };

const ROUTES = [
  {
    id: "fairfax",
    label: "I-66 → Fairfax Drive",
    points: [
      HOME,
      { lat: 38.87893, lon: -77.22810 }, // I-66 / Dulles Connector area
      { lat: 38.88245, lon: -77.11275 }, // Fairfax Drive / Glebe area
      OFFICE
    ]
  },
  {
    id: "washington",
    label: "I-66 → Washington Blvd",
    points: [
      HOME,
      { lat: 38.87893, lon: -77.22810 }, // I-66 / Dulles Connector area
      { lat: 38.88180, lon: -77.12920 }, // Washington Blvd exit area
      { lat: 38.88245, lon: -77.11275 }, // Fairfax / Glebe area
      OFFICE
    ]
  },
  {
    id: "chainbridge",
    label: "No toll via Chain Bridge",
    points: [
      HOME,
      { lat: 38.99060, lon: -77.15710 }, // I-270 / I-495 area
      { lat: 38.96850, lon: -77.13980 }, // Clara Barton / MacArthur area
      { lat: 38.93000, lon: -77.11690 }, // Chain Bridge area
      { lat: 38.92170, lon: -77.12420 }, // Glebe / Chain Bridge Rd area
      OFFICE
    ]
  }
];

async function getRoute(route, key) {
  const coordinateString = route.points
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
    return {
      id: route.id,
      label: route.label,
      ok: false,
      error: data.error?.description || "No route returned"
    };
  }

  const summary = data.routes[0].summary;

  const minutes = Math.round(summary.travelTimeInSeconds / 60);
  const delay = Math.round((summary.trafficDelayInSeconds || 0) / 60);
  const miles = Math.round((summary.lengthInMeters / 1609.344) * 10) / 10;

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
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const routes = await Promise.all(
      ROUTES.map(route => getRoute(route, key))
    );

    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: new Date().toISOString(),
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
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
