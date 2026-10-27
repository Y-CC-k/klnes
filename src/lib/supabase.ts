import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "https://uhunwwvjzuaauklzzuwk.supabase.co";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_hxvVG4tC6-r-ZMge_5lLpQ_eiHArMyh";

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export type StrokeResult = {
  name: string;
  char: string;
  mode: string;
  total: number;
  correct: number;
  ms: number;
};

export async function saveResult(r: StrokeResult): Promise<void> {
  const { error } = await supabase
    .from("stroke_results")
    .insert({ ...r, ms: Math.round(r.ms) });
  if (error) console.warn("無法儲存成績:", error.message);
}

export type LeaderRow = { name: string; correct: number; count: number };

export async function loadLeaderboard(): Promise<LeaderRow[]> {
  const { data, error } = await supabase
    .from("stroke_results")
    .select("name, correct")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.warn("無法載入排行榜:", error.message);
    return [];
  }
  const acc = new Map<string, LeaderRow>();
  for (const row of data ?? []) {
    const cur = acc.get(row.name) ?? { name: row.name, correct: 0, count: 0 };
    cur.correct += row.correct ?? 0;
    cur.count += 1;
    acc.set(row.name, cur);
  }
  return [...acc.values()].sort((a, b) => b.correct - a.correct).slice(0, 10);
}
