import { useCallback, useEffect, useMemo, useState } from "react";
import StrokePractice, { type PracticeMode, type StrokeEvent } from "./components/StrokePractice";
import { WORD_SETS, uniqueChars, getRadical } from "./lib/characters";
import { lookupMoedict, moedictCharImageUrl, type MoedictEntry } from "./lib/moedict";
import { loadLeaderboard, saveResult, type LeaderRow } from "./lib/supabase";

const MODES: { id: PracticeMode; label: string; desc: string }[] = [
  { id: "animate", label: "👀 筆順動畫", desc: "看好筆順怎麼寫" },
  { id: "guided", label: "🖐 引導練習", desc: "寫錯幾次會有提示" },
  { id: "free", label: "🏆 挑戰測驗", desc: "不給提示，全靠實力" },
];

const NAME_KEY = "stroke-practice:name";

export default function App() {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [setNameIdx, setSetNameIdx] = useState(0);
  const [char, setChar] = useState("天");
  const [mode, setMode] = useState<PracticeMode>("animate");
  const [runId, setRunId] = useState(0);
  const [custom, setCustom] = useState("");
  const [dict, setDict] = useState<MoedictEntry | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [strokeCount, setStrokeCount] = useState<number | null>(null);

  const chars = useMemo(() => uniqueChars(WORD_SETS[setNameIdx].chars), [setNameIdx]);
  const h = dict?.heteronyms?.[0];

  const refreshLeaders = useCallback(() => {
    void loadLeaderboard().then(setLeaders);
  }, []);

  useEffect(refreshLeaders, [refreshLeaders]);

  useEffect(() => {
    let alive = true;
    setDictLoading(true);
    setDict(null);
    void lookupMoedict(char).then((entry) => {
      if (alive) {
        setDict(entry);
        setDictLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [char]);

  useEffect(() => {
    let alive = true;
    setStrokeCount(null);
    fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.strokes) setStrokeCount(data.strokes.length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [char]);

  const onSessionComplete = useCallback(
    (e: StrokeEvent) => {
      const who = name.trim() || "匿名";
      localStorage.setItem(NAME_KEY, who);
      void saveResult({
        name: who,
        char: e.char,
        mode: e.mode,
        total: e.strokesTotal,
        correct: e.correct,
        ms: e.ms,
      }).then(() => {
        setSavedMsg(
          `${who} 的「${e.char}」練習完成：${e.correct}/${e.strokesTotal} 筆正確（錯 ${e.mistakes} 次）`
        );
        refreshLeaders();
      });
    },
    [name, refreshLeaders]
  );

  const pickChar = (c: string) => {
    setChar(c);
    setRunId((r) => r + 1);
  };

  const applyCustom = () => {
    const list = uniqueChars(custom.trim().split(/\s+/).slice(-1)[0] ?? "");
    const c = list[list.length - 1];
    if (c) pickChar(c);
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>✍️ 國字筆順練習</h1>
        <p className="sub">筆順動畫 ・ 引導描寫 ・ 挑戰測驗 —— 字義資料來自 萌典 API（CC0 1.0）</p>
      </header>

      <main className="grid">
        {/* 左欄：選字工具 */}
        <section className="panel">
          <h2>1️⃣ 選擇你要練的字</h2>
          <label className="field">
            我的名字（記錄成績用）
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：小美"
              maxLength={12}
            />
          </label>
          <label className="field">
            字表
            <select
              value={setNameIdx}
              onChange={(e) => setSetNameIdx(Number(e.target.value))}
            >
              {WORD_SETS.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="char-grid">
            {chars.map((c) => (
              <button
                key={c}
                className={`char-btn ${c === char ? "active" : ""}`}
                onClick={() => pickChar(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="row">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="自己輸入一個字，如：龜"
              maxLength={4}
              onKeyDown={(e) => e.key === "Enter" && applyCustom()}
            />
            <button onClick={applyCustom}>練這個字</button>
          </div>
        </section>
        <div className="col">
          <div className="mode-row">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`mode-btn ${mode === m.id ? "active" : ""}`}
                onClick={() => {
                  setMode(m.id);
                  setRunId((r) => r + 1);
                }}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
          <StrokePractice
            key={`${char}-${mode}`}
            char={char}
            mode={mode}
            runId={runId}
            onSessionComplete={onSessionComplete}
          />
          {savedMsg && <p className="save-msg">💾 {savedMsg}</p>}

          <section className="panel">
            <h2>🏅 挑戰排行榜</h2>
            {leaders.length === 0 && <p className="muted">還沒有紀錄，快來當第一名！</p>}
            <ol className="leaders">
              {leaders.map((l, i) => (
                <li key={l.name + i}>
                  <span className="rank">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}</span>
                  <span className="lname">{l.name}</span>
                  <span className="lcorrect">{l.correct} 筆</span>
                  <span className="lcount">（{l.count} 次）</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* 右欄：基本資訊 + 萌典字義 */}
        <div className="col">
          <div className="info-card panel">
            <h2>📖 基本資訊</h2>
            <dl className="info-list">
              <div className="info-row">
                <dt>注音</dt>
                <dd>{h?.bopomofo ?? "—"}</dd>
              </div>
              <div className="info-row">
                <dt>拼音</dt>
                <dd>{h?.pinyin ?? "—"}</dd>
              </div>
              <div className="info-row">
                <dt>部首</dt>
                <dd>{dict?.radical ?? getRadical(char)}</dd>
              </div>
              <div className="info-row">
                <dt>總筆畫</dt>
                <dd>{dict?.stroke_count ?? strokeCount ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <section className="panel dict">
            <h2>📖 萌典查詢</h2>
            {dictLoading && <p className="muted">查詢中…</p>}
            {!dictLoading && !dict && <p className="muted">查不到這個字的資料。</p>}
            {dict?.heteronyms?.slice(0, 2).map((h, i) => (
              <div key={i} className="heteronym">
                <div className="bopomofo">
                  {h.bopomofo && <span className="bpm">{h.bopomofo}</span>}
                  {h.pinyin && <span className="py">{h.pinyin}</span>}
                </div>
                {h.definitions?.slice(0, 3).map((d, j) => (
                  <p key={j} className="def">
                    {d.type && <em className="tag">{d.type}</em>}
                    {d.def}
                    {d.example?.slice(0, 1).map((ex, k) => (
                      <span key={k} className="ex">
                        例：{ex}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            ))}
            <p className="muted small">
              字圖範例：<a href={moedictCharImageUrl(char)} target="_blank" rel="noreferrer">萌典《{char}》字圖</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="foot">
        <span>
          資料庫：Supabase ・ 筆順字形：hanzi-writer-data（CC BY-SA 3.0）・
          字義：萌典 Moedict（CC0 1.0, g0v）
        </span>
      </footer>
    </div>
  );
}
