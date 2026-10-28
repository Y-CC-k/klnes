# Y-CC-k GitHub 專案資料分析與說明

| 項目 | 內容 |
| --- | --- |
| 分析對象 | https://github.com/Y-CC-k/ |
| 分析日期 | 2026-10-29 |
| 帳號資訊 | 建立於 2025-07，公開專案 6 個（含 1 個 fork） |
| 分析方式 | GitHub REST API、raw 檔案內容、各站線上頁面實測、Supabase REST 查詢 |

---

## 1. 總覽

| # | 專案 | 類型 | 線上網址 | 技術 | 資料存放 | 資料量 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **klnes** | 國字筆順練習 | https://Y-CC-k.github.io/klnes/ | Vite + React + TS | Supabase + 外部 API | 5 筆練習紀錄 |
| 2 | **english** | 國小英文單字學習網 | https://Y-CC-k.github.io/english/ | Vite + React 19 + TS | Supabase（Auth + 4 張表） | 由 1200ENGLISH 字庫灌入 |
| 3 | **1200ENGLISH** | 英文單字學習網（舊版） | https://Y-CC-k.github.io/1200ENGLISH/ | 原生 HTML/JS + 音檔 | 靜態資料 + 音檔 | 144 個音檔、repo 約 123 MB |
| 4 | **1200** | 英文單字學習網（玻璃風格） | https://Y-CC-k.github.io/1200/ | 原生 HTML/JS + TTS | 靜態 JSON | 4 個年級、1,568 個單字 |
| 5 | **klnes-001** | 班級點名與加分系統入口 | https://Y-CC-k.github.io/klnes-001/ | 純轉址頁 | Google Apps Script（Google Sheets） | 站外，無法從 repo 取得 |
| – | **ngrok-docs** | ngrok 官方文件 | – | – | – | fork，非本人開發 |

> 觀察：五個自建專案剛好形成三組教材線 —— 國語筆順（klnes）、英文單字（english / 1200ENGLISH / 1200）、班級經營（klnes-001）。

---

## 2. 各專案資料分析

### 2.1 klnes（國字筆順練習）

**用途**：國小學生練習國字筆順，含動畫、描寫、測驗三模式，成績寫入資料庫產生排行榜。

**資料來源（三種）**

| 來源 | 端點 | 內容 | 授權 |
| --- | --- | --- | --- |
| hanzi-writer-data 2.0 | jsDelivr（備援 unpkg） | 每字筆順向量（strokes） | CC BY-SA 3.0 |
| 萌典 Moedict | `www.moedict.tw/uni/{字}.json` | 注音、拼音、釋義、例句、部首、總筆畫 | CC0 1.0 |
| Supabase | `stroke_results` 資料表 | 練習成績 | 自建 |

**站內靜態資料**

- 三組字表：低年級常見字、中年級生活字、筆畫多挑戰字（`src/lib/characters.ts`）。
- 部首對照表 `RADICALS`：內建約 90 字，僅作為萌典查無資料時的備援。

**資料表 `stroke_results`**

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid | 主鍵 |
| created_at | timestamptz | 建立時間（預設 now） |
| name | text | 練習者姓名（未填為「匿名」） |
| char | text | 練習的字 |
| mode | text | animate / guided / free |
| total | int | 該字總筆畫 |
| correct | int | 正確筆畫數 |
| ms | int | 花費毫秒 |

**目前資料狀況（實測 2026-10-29）**

- 總筆數：**5 筆**（皆為 2026-10-27 測試資料）
- 練習者：匿名 4 筆、測試 1 筆 → **尚無真實學生資料**
- 練習字：天 4 筆、五 1 筆 → 集中單一字
- 模式：自由挑戰 3 筆、引導練習 2 筆
- 成績：5 筆皆 4/4 全對（正確率 100%）
- 花費時間：1,200–8,071 ms，平均 **5,385 ms**

**資料解讀**

1. 目前資料量不足以做學習分析，只能確認寫入／讀取流程正常。
2. 全部滿分代表可能是操作測試（每筆都 4 筆全對），非真實難度分佈。
3. `total` 與 `correct` 分開存是好的設計，可直接算正確率；但缺少「錯了幾次（mistakes）」欄位，動機分析會少一半資訊。
4. 排行榜是前端抓 1,000 筆後在瀏覽器彙總，資料量變大後會變慢。

---

### 2.2 english（國小英文單字學習網）

**用途**：英文單字學習 + 測驗 + 對戰 + 排行榜，含會員登入。

**技術**：Vite 8、React 19、TypeScript、`@supabase/supabase-js`（Auth + Database）。

**資料表（由程式碼 `.from()` 實際呼叫整理）**

| 資料表 | 使用位置 | 用途 |
| --- | --- | --- |
| `words` | Quiz、WordStudy、Battle、CardBattle | 單字主檔（拼字、音標、詞性、中文、例句） |
| `scores` | Quiz、Leaderboard | 測驗成績：`name, grade, week, qtype, score, total` |
| `profiles` | App | 會員資料 |
| `monsters` | Battle | 對戰怪物資料 |

**字庫來源**：`scripts/seed-words.cjs` 明確指出來源為 `1200_ENGLISH/document/grade3~6.json`，透過 Supabase RPC `admin_load_words`（security definer + secret 驗證）分批清除／upsert。

**資料流**

```
1200ENGLISH/document/grade3~6.json
  → seed-words.cjs（管理工具，本機執行）
  → Supabase RPC admin_load_words
  → words 資料表
  → 前端 Quiz / WordStudy / Battle / CardBattle / Leaderboard
```

**觀察**

- 這是五個專案中**資料架構最完整**的：有正規化單字表、會員、成績、遊戲資料。
- 有 `.env` 與公開金鑰設計說明，並區分 anon key 與 service role key，安全觀念正確。
- `scripts/` 內有多支檢查工具（RLS 檢查、音檔對齊檢查、URL 檢查），顯示已進入維護階段。

---

### 2.3 1200ENGLISH（舊版英文學習網）

- 原生 HTML / CSS / JS，無框架。
- **資料量最大**：repo 約 125,907 KB（≈ 123 MB），其中 `Audio/Grade3~6` 共 **144 個音檔**（每年級 36 個）。
- 資料以「年級 → 週次」組織，前端依 `Audio/${audioSrc}` 組路徑播放。
- 相當於 english 專案的**資料來源與前身**；新版已把單字搬進 Supabase，但音檔仍留在這個 repo。

**風險**：音檔直接進 Git，repo 已達 123 MB，clone／部署都慢；建議移到 Supabase Storage 或 CDN。

---

### 2.4 1200（玻璃風格英文學習網）

**資料結構**（`document/grade3.json`～`grade6.json`）

```json
{
  "gradeName": "三年級",
  "weeks": [
    { "week": 1, "content": [
      { "word": "the", "phonetic": "/ðə/", "pos": "art.", "chinese": "這；那", "sentence": "The pencil is long." }
    ]}
  ]
}
```

**字庫規模（實際解析）**

| 年級 | 週數 | 單字數 | 檔案大小 |
| --- | --- | --- | --- |
| 三年級 | 36 | 288 | 53 KB |
| 四年級 | 36 | 433 | 82 KB |
| 五年級 | 36 | 432 | 84 KB |
| 六年級 | 36 | 415 | 81 KB |
| **合計** | 144 週 | **1,568 字** | 約 300 KB |

- 每個單字 5 個欄位：`word`、`phonetic`、`pos`、`chinese`、`sentence` → 結構一致，適合直接匯入資料庫。
- 發音使用瀏覽器 **TTS（speechSynthesis）**，不需音檔。
- 網站的 `homepage` 設為 `https://1200-zeta.vercel.app`，**實測回 404（已失效）**；實際可用的是 GitHub Pages 版本。

---

### 2.5 klnes-001（班級點名與加分系統）

- 只有一個 `index.html`（989 bytes）＋ `備份` 資料夾。
- 功能：開啟後自動轉址到 Google Apps Script：
  `https://script.google.com/macros/s/AKfycb.../exec`
- **資料不在 GitHub**：實際資料（名單、加分紀錄）存在 Google Sheets，由 Apps Script 讀寫。

**觀察**：GitHub 專案只是「好記的短網址」角色，真正的系統與資料都在 Google 生態系；若 Apps Script 部署 ID 變更，這個入口就會失效（目前程式碼把網址寫死在頁面中）。

---

## 3. 跨站資料比較

| 面向 | klnes | english | 1200 / 1200ENGLISH | klnes-001 |
| --- | --- | --- | --- | --- |
| 資料型態 | 練習成績 | 單字＋會員＋成績＋遊戲 | 單字＋音檔 | 名單＋加分 |
| 儲存位置 | Supabase | Supabase | 靜態檔案 | Google Sheets |
| 資料量 | 5 筆 | 1,568 字來源 | 1,568 字／144 音檔 | 站外 |
| 使用者識別 | 姓名（無驗證） | Supabase Auth | 無 | 站外 |
| 可分析性 | 低（資料太少） | 高 | 中（靜態） | 低（站外） |

**共同模式**：教材內容（字庫）幾乎都來自同一份 1,568 字資料，四個英文專案其實是同一份資料的不同「呈現層」；資料治理才是核心，前端只是殼。

---

## 4. 資料品質與風險

| 風險 | 影響 | 建議 |
| --- | --- | --- |
| klnes 只有測試資料 | 無法分析學習成效 | 累積真實班級資料；加「錯幾次」欄位 |
| 姓名無驗證、可任意填 | 排行榜可能被冒名／亂填 | 改用代號或簡單 PIN，或接 Supabase Auth |
| 匿名寫入權限公開 | 可能被大量寫入 | 加 rate limit 或改走 Edge Function |
| 排行榜前端彙總 1,000 筆 | 資料變多會變慢 | 改 DB view / RPC 聚合 |
| 音檔 123 MB 進 Git | repo 肥大、部署慢 | 移至 Supabase Storage／CDN |
| 1200 的 Vercel 連結 404 | 使用者點到死連結 | 移除 homepage 或改指 GitHub Pages |
| klnes-001 寫死 Apps Script URL | 換部署即失效 | 改為設定檔或改用短網址服務 |
| 多站共用同一批字庫但各自維護 | 版本不一致 | 建立單一 `words` 來源（Supabase 為準） |

---

## 5. 建議行動（依優先序）

1. **整併字庫**：以 `english` 的 Supabase `words` 表為單一來源，1200 / 1200ENGLISH 改為讀 API 或定期匯出。
2. **klnes 補資料欄位**：新增 `mistakes`、`duration` 已有 `ms`、`grade`，才能做難度與進步分析。
3. **排行榜改 RPC**：`select name, sum(correct), count(*) group by name order by 2 desc limit 10`。
4. **音檔外部化**：144 個音檔搬離 Git，改用 Storage/CDN，repo 可從 123 MB 降到 < 1 MB。
5. **入口頁健檢**：修正 1200 的失效連結、klnes-001 的寫死網址。
6. **建立跨站索引頁**：把五個教學網站集中成一個入口（可放在 GitHub Pages 首頁）。

---

## 附錄：查詢方式

- 專案清單：`GET https://api.github.com/users/Y-CC-k/repos`
- 字庫：`GET https://raw.githubusercontent.com/Y-CC-k/1200/main/document/grade{3..6}.json`
- 成績：`GET https://uhunwwvjzuaauklzzuwk.supabase.co/rest/v1/stroke_results?select=*`
- 各站線上檢查：`https://Y-CC-k.github.io/{klnes|english|1200|1200ENGLISH|klnes-001}/`
