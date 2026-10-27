import { useEffect, useState } from "react";
import { lookupMoedict, type MoedictEntry } from "../lib/moedict";

type Props = {
  char: string;
  onPlayStroke: () => void;
  onPractice: () => void;
};

export default function CharacterDetail({ char, onPlayStroke, onPractice }: Props) {
  const [entry, setEntry] = useState<MoedictEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setEntry(null);
    void lookupMoedict(char).then((e) => {
      if (alive) {
        setEntry(e);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [char]);

  const h = entry?.heteronyms?.[0];

  return (
    <section className="detail">
      <div className="detail-grid">
        {/* 左側：基本資訊 */}
        <aside className="detail-side">
          <div className="panel info-card">
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
                <dt>釋義</dt>
                <dd className="def">
                  {loading && "查詢中…"}
                  {!loading && !entry && "查無資料"}
                  {h?.Definitions?.[0]?.def ?? ""}
                </dd>
              </div>
            </dl>
          </div>
          <div className="panel info-card">
            <h2>💡 例句</h2>
            <p className="muted">
              {h?.Definitions?.[0]?.example?.[0] ?? "（無例句）"}
            </p>
          </div>
        </aside>

        {/* 中央：巨大生字卡片 */}
        <div className="detail-center">
          <div className="big-char-card">
            <div className="card-badge">學習中</div>
            <span className="big-char">{char}</span>
            <p className="muted small">點選下方按鈕開始練習</p>
          </div>

          <div className="detail-actions">
            <button className="action-btn primary" onClick={onPlayStroke}>
              <span>▶</span> 播放筆順
            </button>
            <button className="action-btn secondary" onClick={onPractice}>
              <span>✍️</span> 線上練寫
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
