# ✍️ 國字筆順練習 (stroke-practice)

線上國字筆順練習網頁：筆順動畫、引導描寫、挑戰測驗，並將練習成績存入 Supabase 做排行榜。

## 技術

- **Vite + React + TypeScript**
- **hanzi-writer** — 筆順動畫與描寫測驗引擎（字形資料為 hanzi-writer-data，CC BY-SA 3.0）
- **萌典 API (Moedict, g0v)** — 查注音與字義，資料授權 **CC0 1.0**
  - 端點：`GET https://www.moedict.tw/uni/{字}.json`、字圖 `https://www.moedict.tw/uni/{字}.svg`
- **Supabase** — 儲存練習紀錄 `stroke_results` 資料表並產生排行榜

## Supabase 資料表

```sql
create table if not exists public.stroke_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  char text not null,
  mode text not null,          -- animate / guided / free
  total int not null default 0,
  correct int not null default 0,
  ms int
);
```

（RLS 已開啟，政策允許匿名寫入與讀取；上述 migration 已套用於預備用專案。）

## 開發

```bash
cd stroke-practice
cp .env.example .env   # 填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev            # http://localhost:5179
npm run build
```

## 功能

1. **選字**：內建低／中年級常用字表＋自由輸入任一國字
2. **筆順動畫**：循環播放／單次播放
3. **引導練習**：照筆順描寫，寫錯多次自動出現下一筆提示
4. **挑戰測驗**：無提示，完成後正確／錯誤統計
5. **萌典查詢**：顯示注音、拼音、釋義與例句
6. **排行榜**：成績寫入 Supabase，顯示前 10 名
