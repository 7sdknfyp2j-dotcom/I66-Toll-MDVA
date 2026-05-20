const ROUTES = [
  {
    id: "fairfax",
    label: "I-66 → Fairfax Drive",
    coordinates: [
      [39.06562, -77.18964],
      [38.87893, -77.22810],
      [38.88245, -77.11275],
      [38.88323, -77.11638]
    ]
  },
  {
    id: "washington",
    label: "I-66 → Washington Blvd",
    coordinates: [
      [39.06562, -77.18964],
      [38.87893, -77.22810],
      [38.88180, -77.12920],
      [38.88245, -77.11275],
      [38.88323, -77.11638]
    ]
  },
  {
    id: "chainbridge",
    label: "No toll via Chain Bridge",
    coordinates: [
      [39.06562, -77.18964],
      [38.99060, -77.15710],
      [38.96850, -77.13980],
      [38.93000, -77.11690],
      [38.92170, -77.12420],
      [38.88323, -77.11638]
    ]
  }
];

async function getRoute(route, key) {
  const coordinateString = route.coordinates
    .map(([lat, lon]) => `${lat},${lon}`)
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

  if (!data.routes || !data.routes[0]) {
    return {
      id: route.id,
      label: route.label,
      ok: false,
      timeLabel: "Unavailable",
      distanceLabel: "",
      delayLabel: data.error?.description || "No route returned"
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
    distanceLabel: `${miles} mi`,
    delayLabel: delay > 0 ? `${delay} min traffic delay` : "No major traffic delay"
  };
}

export async function onRequest(context) {
  const key = context.env.TOMTOM_API_KEY;

  if (!key) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Missing TOMTOM_API_KEY in Cloudflare."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const routes = await Promise.all(
    ROUTES.map(route => getRoute(route, key))
  );

  return new Response(JSON.stringify({
    ok: true,
    updatedAt: new Date().toISOString(),
    routes
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
