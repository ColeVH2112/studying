// Drill mode — SPEC §8.2. Preset picker → countdown → rapid-fire prompts with a
// pace strip → end screen, saved to DrillResult history.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DrillPreset, DrillResult, MentalMathCategory, MentalMathItem } from '../types';
import { parseNumeric } from '../engine/grading';
import { rngFromString } from '../engine/rng';
import { ALL_CATEGORIES, CATEGORY_LABELS, generateFrom } from '../../content/generators/mental-math';
import { saveDrill, useApp } from '../store';

const PRESETS: DrillPreset[] = [
  { id: 'optiver', label: 'Optiver pace', total: 80, seconds: 480, categories: ALL_CATEGORIES },
  { id: 'sprint', label: 'Sprint', total: 30, seconds: 180, categories: ALL_CATEGORIES },
];

type Phase = 'picker' | 'countdown' | 'running' | 'done';

function checkDrill(item: MentalMathItem, raw: string): boolean {
  const p = parseNumeric(raw);
  if (!p.ok) return false;
  const tol = item.tolerance ?? 1e-6;
  return Math.abs(p.value - item.value) <= tol;
}

interface RunOutcome {
  total: number;
  correct: number;
  seconds: number;
  perCategory: Record<string, { n: number; correct: number }>;
}

export function DrillMode({ today }: { today: string }) {
  const app = useApp();
  const [phase, setPhase] = useState<Phase>('picker');
  const [preset, setPreset] = useState<DrillPreset>(PRESETS[0] as DrillPreset);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);

  // custom config
  const [customCats, setCustomCats] = useState<MentalMathCategory[]>(ALL_CATEGORIES.slice());
  const [customTotal, setCustomTotal] = useState(40);
  const [customSeconds, setCustomSeconds] = useState(300);

  const start = (p: DrillPreset) => { setPreset(p); setPhase('countdown'); };

  return (
    <div className="scroll-route">
      <div className="page">
        <h1 className="page__title">Drill</h1>
        {phase === 'picker' && (
          <Picker
            customCats={customCats} setCustomCats={setCustomCats}
            customTotal={customTotal} setCustomTotal={setCustomTotal}
            customSeconds={customSeconds} setCustomSeconds={setCustomSeconds}
            onStart={start}
          />
        )}
      </div>

      {phase === 'countdown' && <Countdown onDone={() => setPhase('running')} />}
      {phase === 'running' && (
        <Runner
          preset={preset}
          onFinish={(o) => {
            setOutcome(o);
            saveDrill({
              date: today, preset: preset.id, total: o.total, correct: o.correct,
              seconds: o.seconds, perCategory: o.perCategory,
            });
            setPhase('done');
          }}
          onAbort={() => setPhase('picker')}
        />
      )}
      {phase === 'done' && outcome && (
        <div className="page">
          <EndScreen preset={preset} outcome={outcome} priorBest={bestFor(app.drills, preset.id)} onAgain={() => setPhase('picker')} />
        </div>
      )}
    </div>
  );
}

function bestFor(drills: DrillResult[], presetId: string): number {
  return drills.filter((d) => d.preset === presetId).reduce((m, d) => Math.max(m, d.correct), 0);
}

// --------------------------------------------------------------------- picker

function Picker(props: {
  customCats: MentalMathCategory[];
  setCustomCats: (c: MentalMathCategory[]) => void;
  customTotal: number; setCustomTotal: (n: number) => void;
  customSeconds: number; setCustomSeconds: (n: number) => void;
  onStart: (p: DrillPreset) => void;
}) {
  const toggle = (c: MentalMathCategory) =>
    props.setCustomCats(
      props.customCats.includes(c) ? props.customCats.filter((x) => x !== c) : [...props.customCats, c],
    );
  const customValid = props.customCats.length > 0 && props.customTotal > 0 && props.customSeconds > 0;

  return (
    <>
      <p className="lead">Timed mental arithmetic. Type the answer, press Enter; Esc skips (counts wrong).</p>
      <div className="preset-grid">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="preset" onClick={() => props.onStart(p)}>
            <h3>{p.label}</h3>
            <span className="meta">{p.total} questions · {Math.floor(p.seconds / 60)}:{String(p.seconds % 60).padStart(2, '0')} · all categories</span>
          </button>
        ))}
      </div>

      <hr className="divider" />
      <h2>Custom</h2>
      <div className="field">
        <label>Categories</label>
        <div className="topic-toggles">
          {ALL_CATEGORIES.map((c) => (
            <label key={c} className="toggle">
              <input type="checkbox" checked={props.customCats.includes(c)} onChange={() => toggle(c)} />
              {CATEGORY_LABELS[c]}
            </label>
          ))}
        </div>
      </div>
      <div className="field btn-row">
        <label>Questions <input className="num-input mono" type="number" min={1} value={props.customTotal}
          onChange={(e) => props.setCustomTotal(Math.max(1, Number(e.target.value) || 0))} /></label>
        <label>Seconds <input className="num-input mono" type="number" min={10} value={props.customSeconds}
          onChange={(e) => props.setCustomSeconds(Math.max(10, Number(e.target.value) || 0))} /></label>
        <button type="button" className="btn" disabled={!customValid}
          onClick={() => props.onStart({ id: 'custom', label: 'Custom', total: props.customTotal, seconds: props.customSeconds, categories: props.customCats })}>
          Start custom
        </button>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ countdown

function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n <= 0) { onDone(); return; }
    const id = setTimeout(() => setN((x) => x - 1), 700);
    return () => clearTimeout(id);
  }, [n, onDone]);
  return (
    <div className="drill__stage">
      <div className="drill__countdown mono">{n > 0 ? n : 'go'}</div>
    </div>
  );
}

// --------------------------------------------------------------------- runner

function Runner({ preset, onFinish, onAbort }: {
  preset: DrillPreset;
  onFinish: (o: RunOutcome) => void;
  onAbort: () => void;
}) {
  const rngRef = useRef<() => number>(rngFromString(`drill|${preset.id}|${Date.now()}`));
  const startRef = useRef<number>(Date.now());
  const [item, setItem] = useState<MentalMathItem>(() => generateFrom(preset.categories, rngRef.current));
  const [raw, setRaw] = useState('');
  const [answered, setAnswered] = useState(0);
  const [remaining, setRemaining] = useState(preset.seconds);
  const inputRef = useRef<HTMLInputElement>(null);

  const correctRef = useRef(0);
  const perCat = useRef<Record<string, { n: number; correct: number }>>({});

  const finish = useCallback(() => {
    const seconds = Math.min(preset.seconds, Math.round((Date.now() - startRef.current) / 1000));
    onFinish({
      total: preset.total,
      correct: correctRef.current,
      seconds: Math.max(1, seconds),
      perCategory: perCat.current,
    });
  }, [onFinish, preset.seconds, preset.total]);

  // countdown clock
  useEffect(() => {
    const id = setInterval(() => {
      const left = preset.seconds - (Date.now() - startRef.current) / 1000;
      setRemaining(Math.max(0, left));
      if (left <= 0) finish();
    }, 200);
    return () => clearInterval(id);
  }, [preset.seconds, finish]);

  useEffect(() => { inputRef.current?.focus(); }, [item]);

  const record = (isCorrect: boolean) => {
    const cat = item.category;
    const pc = perCat.current[cat] ?? { n: 0, correct: 0 };
    perCat.current[cat] = { n: pc.n + 1, correct: pc.correct + (isCorrect ? 1 : 0) };
    if (isCorrect) correctRef.current += 1;
    const next = answered + 1;
    setAnswered(next);
    if (next >= preset.total) { finish(); return; }
    setItem(generateFrom(preset.categories, rngRef.current));
    setRaw('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); record(checkDrill(item, raw)); }
    else if (e.key === 'Escape') { e.preventDefault(); record(false); }
  };

  const neededRate = preset.total / preset.seconds;          // q/s required
  const elapsed = Math.max(0.001, (preset.seconds - remaining));
  const actualRate = answered / elapsed;
  const onPace = actualRate >= neededRate;
  const expectedByNow = Math.min(preset.total, neededRate * elapsed);
  const progress = Math.min(1, answered / preset.total);

  return (
    <div className="drill">
      <div className={`pace ${onPace ? 'pace--ahead' : 'pace--behind'}`}>
        <span>{answered}/{preset.total}</span>
        <div className="pace__track" aria-hidden="true"><div className="pace__fill" style={{ width: `${progress * 100}%` }} /></div>
        {/* needed vs. actual question rate (§8.2) */}
        <span className="pace__rate">{Math.round(actualRate * 60)}/min · need {Math.round(neededRate * 60)}/min</span>
        <span>{onPace ? 'on pace' : `behind ${Math.ceil(expectedByNow - answered)}`}</span>
        <span className="clock">{Math.floor(remaining / 60)}:{String(Math.floor(remaining % 60)).padStart(2, '0')}</span>
      </div>
      <div className="drill__stage">
        <div className="drill__prompt">{item.prompt}</div>
        <input
          ref={inputRef}
          className="drill__input"
          type="text"
          inputMode="decimal"
          aria-label="Answer"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="drill__count mono">Enter to submit · Esc to skip</div>
        <button type="button" className="btn btn--quiet" onClick={onAbort}>End drill</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- end screen

function EndScreen({ preset, outcome, priorBest, onAgain }: {
  preset: DrillPreset;
  outcome: RunOutcome;
  priorBest: number;
  onAgain: () => void;
}) {
  const answered = Object.values(outcome.perCategory).reduce((a, c) => a + c.n, 0);
  // accuracy is correct / attempted (not / target) — most users won't finish the
  // 80-question Optiver preset, so dividing by the target would understate it.
  const accuracy = answered > 0 ? outcome.correct / answered : 0;
  const sPerQ = answered > 0 ? outcome.seconds / answered : 0;
  const isPB = outcome.correct > priorBest;

  const cats = useMemo(() => Object.entries(outcome.perCategory).sort((a, b) => b[1].n - a[1].n), [outcome]);

  return (
    <>
      <h2>{preset.label} — results {isPB && <span className="badge badge--new">personal best</span>}</h2>
      <div className="stat-grid">
        <div className="stat"><div className="v">{outcome.correct}/{outcome.total}</div><div className="k">score</div></div>
        <div className="stat"><div className="v">{Math.round(accuracy * 100)}%</div><div className="k">accuracy</div></div>
        <div className="stat"><div className="v">{sPerQ.toFixed(1)}s</div><div className="k">per question</div></div>
        <div className="stat"><div className="v">{outcome.seconds}s</div><div className="k">time</div></div>
        <div className="stat"><div className="v">{Math.max(priorBest, outcome.correct)}</div><div className="k">best</div></div>
      </div>

      {cats.length > 0 && (
        <table className="table">
          <thead><tr><th>category</th><th>seen</th><th>correct</th><th>acc</th></tr></thead>
          <tbody>
            {cats.map(([c, v]) => (
              <tr key={c}>
                <td>{CATEGORY_LABELS[c as MentalMathCategory] ?? c}</td>
                <td className="num">{v.n}</td>
                <td className="num">{v.correct}</td>
                <td className="num">{v.n > 0 ? Math.round((v.correct / v.n) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="btn-row" style={{ marginTop: 'var(--sp-5)' }}>
        <button type="button" className="btn" onClick={onAgain}>Drill again</button>
        <a className="btn btn--quiet" href="#stats">See trend</a>
      </div>
    </>
  );
}
