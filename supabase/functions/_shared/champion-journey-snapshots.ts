export type ChampionJourneySnapshot = {
  profileKey: string;
  gameName: string;
  tagLine: string;
  platform: string;
  capturedAt: string;
  sampleMatches: number;
  signature: string | null;
  champions: Array<{
    name: string;
    games: number;
    avgKda: number | null;
    masteryPoints: number;
    masteryLevel: number;
  }>;
  sourceVersion?: string | null;
};

function canonicalChampions(value: ChampionJourneySnapshot["champions"]) {
  return JSON.stringify(
    [...value]
      .map(x => ({
        name: String(x.name || ""),
        games: Number(x.games || 0),
        avgKda: x.avgKda == null ? null : Number(x.avgKda),
        masteryPoints: Number(x.masteryPoints || 0),
        masteryLevel: Number(x.masteryLevel || 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

export async function persistChampionJourneySnapshot(db: any, snapshot: ChampionJourneySnapshot) {
  const { data: previous, error: previousError } = await db
    .from("lol_champion_journey_snapshots")
    .select("sample_matches,signature,champions")
    .eq("profile_key", snapshot.profileKey)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousError) throw previousError;

  const unchanged =
    previous &&
    Number(previous.sample_matches || 0) === Number(snapshot.sampleMatches || 0) &&
    String(previous.signature || "") === String(snapshot.signature || "") &&
    canonicalChampions(Array.isArray(previous.champions) ? previous.champions : []) === canonicalChampions(snapshot.champions);

  if (unchanged) return { inserted: false, reason: "unchanged" };

  const row = {
    profile_key: snapshot.profileKey,
    game_name: snapshot.gameName,
    tag_line: snapshot.tagLine,
    platform: snapshot.platform,
    captured_at: snapshot.capturedAt,
    sample_matches: snapshot.sampleMatches,
    signature: snapshot.signature,
    champions: snapshot.champions,
    source_version: snapshot.sourceVersion ?? null,
  };

  const { error } = await db.from("lol_champion_journey_snapshots").insert(row);
  if (error) throw error;
  return { inserted: true };
}

export async function readChampionJourneySnapshots(db: any, profileKey: string, limit = 24) {
  const { data, error } = await db
    .from("lol_champion_journey_snapshots")
    .select("captured_at,sample_matches,signature,champions,source_version")
    .eq("profile_key", profileKey)
    .order("captured_at", { ascending: false })
    .limit(Math.min(52, Math.max(1, limit)));
  if (error) throw error;
  return (data ?? []).reverse();
}
