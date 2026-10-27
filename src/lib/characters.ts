/** 練習用字表（教育部國小學習字表常用字節選） */
export const WORD_SETS: { label: string; chars: string }[] = [
  {
    label: "低年級常見字",
    chars:
      "一二三四五六七八九十大小上下中出入日月山水火木人口手足天开学分合光高长短多大儿女多少进门开口山川花鸟虫鱼",
  },
  {
    label: "中年級生活字",
    chars:
      "校師生教學讀書寫字筆紙畫跑走路見聽說話想問答喜歡朋友幫助感謝快樂健康天氣季節春天秋天冬夏熱冷風雨雲電家庭父母兄姊姑叔公婆",
  },
  {
    label: "筆畫多挑戰字",
    chars:
      "難龜歡寶贏聽覺體驗靈鬱麗驕傲環境餐廳鑰匙震撼題藝魔龍灣嚮導廳鑒藏豐",
  },
];

export function uniqueChars(s: string): string[] {
  return [...new Set([...s])].filter((c) => /\p{Script=Han}/u.test(c));
}
