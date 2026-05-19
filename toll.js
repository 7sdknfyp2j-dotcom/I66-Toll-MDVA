export async function onRequest() {
  const now = new Date();

  const easternTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = easternTime.getDay();
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  const minutesNow = hour * 60 + minute;

  const isWeekday = day >= 1 && day <= 5;
  const eastboundStart = 5 * 60 + 30;
  const eastboundEnd = 9 * 60 + 30;

  const isEastboundTollTime =
    isWeekday && minutesNow >= eastboundStart && minutesNow <= eastboundEnd;

  const routes = [
    {
      id: "fairfax",
      label: "Fairfax Drive",
      route: "Route 267 / Dulles Toll Road eastbound to Fairfax Drive"
    },
    {
      id: "washington",
      label: "Washington Blvd",
      route: "Route 267 / Dulles Toll Road eastbound to Washington Blvd"
    }
  ];

  const responseBody = {
    ok: true,
    updatedAt: new Date().toISOString(),
    tollingActive: isEastboundTollTime,
    message: isEastboundTollTime
      ? "Eastbound tolling period is active. Live active-hour pricing lookup can be added later."
      : "No toll for these trips right now.",
    routes: routes.map(route => ({
      ...route,
      toll: 0,
      tollFormatted: isEastboundTollTime ? "Live lookup needed" : "$0.00",
      message: isEastboundTollTime
        ? "Tolling window is active. Use the official calculator for the live active-hour price until live feed lookup is added."
        : "No toll for this trip right now."
    }))
  };

  return new Response(JSON.stringify(responseBody), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}