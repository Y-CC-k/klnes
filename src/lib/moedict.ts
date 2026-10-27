/**
 * 萌典 (Moedict) API — g0v 開源專案，資料授權 CC0 1.0
 * 端點範例：https://www.moedict.tw/a/字.json
 */

export type MoedictDefinition = {
  type?: string;
  def: string;
  example?: string[];
  quote?: string[];
};

export type MoedictHeteronym = {
  bopomofo?: string;
  pinyin?: string;
  Definitions?: MoedictDefinition[];
};

export type MoedictEntry = {
  title?: string;
  heteronyms?: MoedictHeteronym[];
};

export async function lookupMoedict(char: string): Promise<MoedictEntry | null> {
  try {
    const res = await fetch(
      `https://www.moedict.tw/a/${encodeURIComponent(char)}.json`
    );
    if (!res.ok) return null;
    return (await res.json()) as MoedictEntry;
  } catch {
    return null;
  }
}

/** 筆順資料：萌典尾端點 /uni/，提供 SVG 字圖（：https://www.moedict.tw/uni/字.svg） */
export function moedictCharImageUrl(char: string): string {
  return `https://www.moedict.tw/uni/${encodeURIComponent(char)}.svg`;
}
