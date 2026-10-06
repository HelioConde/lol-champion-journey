(() => {
  const existing = window.CHAMPION_JOURNEY_BACKEND || {};
  const functionsBase = typeof existing.functionsBase === "string" && existing.functionsBase
    ? existing.functionsBase.replace(/\/$/, "")
    : "https://bieihhaobdztjyoweewa.supabase.co/functions/v1";
  window.CHAMPION_JOURNEY_BACKEND = Object.freeze({
    functionsBase,
    lolProfile: existing.lolProfile || functionsBase + "/public-lol-profile",
    snapshotHistory: Object.prototype.hasOwnProperty.call(existing,"snapshotHistory") ? existing.snapshotHistory : null,
    telemetryEndpoint: existing.telemetryEndpoint || null,
    source: "zerotwo-gamer-supabase"
  });
})();