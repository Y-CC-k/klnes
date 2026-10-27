/**
 * 萌典 (Moedict) API — g0v 開源專案，資料授權 CC0 1.0
 * 端點：https://www.moedict.tw/uni/{字}.json  （含注音、釋義、部首、總筆畫）
 */

export type MoedictDefinition = {
  type?: string;
  def: string;
  example?: string[];
  quote?: string[];
};

export type MoedictHeteronym = {
  bopomofo?: string;
  bopomofo2?: string;
  pinyin?: string;
  definitions?: MoedictDefinition[];
};

export type MoedictEntry = {
  title?: string;
  radical?: string;
  stroke_count?: number;
  non_radical_stroke_count?: number;
  heteronyms?: MoedictHeteronym[];
};

export async function lookupMoedict(char: string): Promise<MoedictEntry | null> {
  try {
    const res = await fetch(
      `https://www.moedict.tw/uni/${encodeURIComponent(char)}.json`
    );
    if (!res.ok) return null;
    return (await res.json()) as MoedictEntry;
  } catch {
    return null;
  }
}

export function moedictCharImageUrl(char: string): string {
  return `https://www.moedict.tw/uni/${encodeURIComponent(char)}.svg`;
}
