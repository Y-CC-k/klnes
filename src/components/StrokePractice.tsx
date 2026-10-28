import { useEffect, useRef, useState } from "react";
import HanziWriter, { type CharacterJson, type StrokeData } from "hanzi-writer";

export type PracticeMode = "animate" | "guided" | "free";

export type StrokeEvent = {
  char: string;
  mode: PracticeMode;
  strokesTotal: number;
  correct: number;
  mistakes: number;
  ms: number;
};

type Props = {
  char: string;
  mode: PracticeMode;
  /** 變動 runId 可重開一輪測驗 */
  runId: number;
  onSessionComplete: (e: StrokeEvent) => void;
};

const MODE_LABEL: Record<PracticeMode, string> = {
  animate: "筆順動畫",
  guided: "引導練習",
  free: "挑戰測驗",
};

/** 字形資料載入器：主 CDN jsdelivr，備援 unpkg */
function charDataLoader(
  char: string,
  onLoad: (data: CharacterJson) => void,
  onError: (err?: unknown) => void
) {
  const urls = [
    `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`,
    `https://unpkg.com/hanzi-writer-data@2.0/${char}.json`,
  ];
  const tryLoad = (i: number) => {
    if (i >= urls.length) {
      onError(new Error("字形資料載入失敗"));
      return;
    }
    fetch(urls[i])
      .then((r) => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then((data) => onLoad(data))
      .catch(() => tryLoad(i + 1));
  };
  tryLoad(0);
}

export default function StrokePractice({ char, mode, runId, onSessionComplete }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);
  const wrongRef = useRef(0);
  const rightRef = useRef(0);
  const totalRef = useRef(0);

  const [stats, setStats] = useState({ correct: 0, mistakes: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [boardSize, setBoardSize] = useState(320);

  // 依視窗大小調整寫字板，填滿可用空間
  useEffect(() => {
    const compute = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const availW = wrap.clientWidth - 16;
      const availH = window.matchMedia("(max-width: 1000px)").matches
        ? window.innerHeight - 320
        : wrap.clientHeight - 8;
      const s = Math.max(260, Math.min(680, Math.floor(Math.min(availW, availH) / 20) * 20));
      setBoardSize((prev) => (Math.abs(prev - s) >= 40 ? s : prev));
    };
    compute();
    window.addEventListener("resize", compute);
    const wrap = wrapRef.current;
    const ro = wrap ? new ResizeObserver(compute) : null;
    if (wrap && ro) ro.observe(wrap);
    return () => {
      window.removeEventListener("resize", compute);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    setError(false);
    setLoading(true);
    doneRef.current = false;
    wrongRef.current = 0;
    rightRef.current = 0;
    totalRef.current = 0;
    startRef.current = Date.now();
    setStats({ correct: 0, mistakes: 0, total: 0 });
    host.innerHTML = "";

    const writer = HanziWriter.create(host, char, {
      width: boardSize,
      height: boardSize,
      padding: 20,
      strokeColor: "#1f2937",
      radicalColor: "#15803d",
      outlineColor: "#cbd5e1",
      drawingColor: "#2563eb",
      highlightColor: "#38bdf8",
      highlightOnComplete: true,
      strokeWidth: 5,
      outlineWidth: 3,
      drawingWidth: 6,
      delayBetweenStrokes: 220,
      charDataLoader,
      onLoadCharDataError: () => {
        setError(true);
        setLoading(false);
      },
      onMistake: (d: StrokeData) => {
        wrongRef.current = d.totalMistakes;
        totalRef.current = d.strokeNum + 1 + d.strokesRemaining;
        setStats({
          correct: rightRef.current,
          mistakes: wrongRef.current,
          total: totalRef.current,
        });
      },
      onCorrectStroke: (d: StrokeData) => {
        rightRef.current += 1;
        totalRef.current = d.strokeNum + 1 + d.strokesRemaining;
        setStats({
          correct: rightRef.current,
          mistakes: wrongRef.current,
          total: totalRef.current,
        });
      },
      onComplete: () => {
        if (doneRef.current || mode === "animate") return;
        doneRef.current = true;
        onSessionComplete({
          char,
          mode,
          strokesTotal: totalRef.current,
          correct: rightRef.current,
          mistakes: wrongRef.current,
          ms: Date.now() - startRef.current,
        });
      },
    });
    writerRef.current = writer;

    const mount = () => {
      setLoading(false);
      if (mode === "animate") {
        void writer.loopCharacterAnimation();
      } else {
        void writer.showOutline();
        void writer.quiz({});
      }
    };
    void writer.setCharacter(char).then(mount);

    return () => {
      try {
        writer.cancelQuiz();
      } catch {
        /* 忽略 */
      }
      host.innerHTML = "";
      if (writerRef.current === writer) writerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, mode, runId, boardSize]);

  const playOnce = () => {
    const w = writerRef.current;
    if (!w) return;
    w.cancelQuiz();
    void w.animateCharacter().then(() => {
      if (mode !== "animate") {
        void w.showOutline();
        void w.quiz({});
      }
    });
  };

  return (
    <section className="panel practice">
      <div className="practice-head">
        <div className="mode-badge">{MODE_LABEL[mode]}</div>
        <div className="char-stamp">
          <span className="char-label">目標字</span>
          <span className="char-big">{char}</span>
        </div>
      </div>

      <div className="writer-host-wrap" ref={wrapRef}>
        {loading && <p className="muted">字形載入中…</p>}
        {error && <p className="muted">無法載入「{char}」的字形資料，試試別的字吧。</p>}
        <div ref={hostRef} className="writer-host" data-error={error || undefined} />
      </div>

      <div className="practice-stats" aria-live="polite">
        <span>✅ 正確 {stats.correct} 筆</span>
        <span>❌ 錯誤 {stats.mistakes} 次</span>
        <span>{mode !== "animate" && "拖曳滑鼠照筆順描寫"}</span>
      </div>

      <div className="row">
        <button onClick={playOnce}>▶ 播放一次動畫</button>
      </div>
    </section>
  );
}
