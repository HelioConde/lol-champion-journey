(() => {
  const existing = window.CHAMPION_JOURNEY_BACKEND || {};
  const functionsBase = typeof existing.functionsBase === "string" && existing.functionsBase
    ? existing.functionsBase.replace(/\/$/, "")
    : "https://bieihhaobdztjyoweewa.supabase.co/functions/v1";
  const config = Object.freeze({
    functionsBase,
    lolProfile: existing.lolProfile || functionsBase + "/public-lol-profile",
    source: "zerotwo-gamer-supabase"
  });
  window.CHAMPION_JOURNEY_BACKEND = config;
  window.RIOT_LEGACY_BACKEND = config;
})();