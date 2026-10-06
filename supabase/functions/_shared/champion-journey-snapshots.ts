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

export async function persistChampionJourneySnapshot(db: any, snapshot: ChampionJourneySnapshot) {
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
