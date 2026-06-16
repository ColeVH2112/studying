// Settings — SPEC §8.5. Topic toggles, new-per-session, due:new ratio, and data
// export / import / reset. Theme is fixed in v1 (no toggle).

import { useRef, useState } from 'react';
import type { TopicId } from '../types';
import { ALL_TOPICS, downloadExport, parseImport } from '../engine/storage';
import { applyImport, buildExport, resetAll, setSettings, useApp } from '../store';

export function SettingsView({ today }: { today: string }) {
  const app = useApp();
  const s = app.settings;
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTopic = (t: TopicId) => {
    const enabled = s.enabledTopics.includes(t)
      ? s.enabledTopics.filter((x) => x !== t)
      : [...s.enabledTopics, t];
    setSettings({ ...s, enabledTopics: enabled });
  };

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const res = parseImport(text);
      if (res.ok) { applyImport(res.blob); setMsg('Imported and replaced local data.'); }
      else setMsg(`Import failed: ${res.error}`);
    });
    e.target.value = '';
  }
  function doReset() {
    if (confirm('Erase all QuantFeed progress on this device? Export first if unsure.')) {
      resetAll();
      setMsg('All data reset.');
    }
  }

  return (
    <div className="scroll-route">
      <div className="page">
        <h1 className="page__title">Settings</h1>

        <div className="field">
          <label>Topics in the feed</label>
          <div className="hint">New problems are drawn only from enabled topics. Due reviews always surface.</div>
          <div className="topic-toggles">
            {ALL_TOPICS.map((t) => (
              <label key={t} className="toggle">
                <input type="checkbox" checked={s.enabledTopics.includes(t)} onChange={() => toggleTopic(t)} />
                {t.replace(/-/g, ' ')}
              </label>
            ))}
          </div>
        </div>

        <div className="field btn-row">
          <label>New per session
            <input className="num-input mono" type="number" min={0} max={50} value={s.newPerSession}
              onChange={(e) => setSettings({ ...s, newPerSession: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })} />
          </label>
          <label>Due : new ratio
            <input className="num-input mono" type="number" min={1} max={10} value={s.newRatio}
              onChange={(e) => setSettings({ ...s, newRatio: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} />
          </label>
        </div>
        <p className="hint">One new card is injected after every {s.newRatio} due cards, up to {s.newPerSession} new per session.</p>

        <hr className="divider" />
        <h2>Data</h2>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => { downloadExport(buildExport(), today); setMsg('Exported backup JSON.'); }}>Export backup</button>
          <button type="button" className="btn btn--quiet" onClick={() => fileRef.current?.click()}>Import backup</button>
          <button type="button" className="btn btn--quiet" onClick={doReset}>Reset all</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onPickFile} />
        </div>
        {msg && <p className="muted" role="status" style={{ marginTop: 'var(--sp-3)' }}>{msg}</p>}
      </div>
    </div>
  );
}
