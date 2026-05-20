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

  const tollingActive =
    isWeekday && minutesNow >= eastboundStart && minutesNow <= eastboundEnd;

  const routes = [
    {
      id: "fairfax",
      label: "Fairfax Drive",
      tollFormatted: tollingActive ? "Check official toll" : "$0.00",
      message: tollingActive
        ? "Eastbound tolling window is active."
        : "No toll for this trip right now."
    },
    {
      id: "washington",
      label: "Washington Blvd",
      tollFormatted: tollingActive ? "Check official toll" : "$0.00",
      message: tollingActive
        ? "Eastbound tolling window is active."
        : "No toll for this trip right now."
    }
  ];

  return new Response(
    JSON.stringify({
      ok: true,
      updatedAt: new Date().toISOString(),
      tollingActive,
      routes
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
