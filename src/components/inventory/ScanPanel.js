import React, { useEffect, useRef, useState } from 'react';
import { ScanLine, Undo2, X } from 'lucide-react';

/**
 * Tryb skanowania. Czytniki kodów kreskowych, QR i większość czytników RFID na USB działają jak klawiatura:
 * wpisują kod i naciskają Enter – dlatego wystarczy zwykłe pole tekstowe, które ma fokus.
 *
 * onScan({ code, mode, quantity }) → { entry } | { error } | { unknown: true }
 * onUndo(entry) → komunikat błędu albo null
 * onAssign(itemId, code) → komunikat błędu albo null
 */
function ScanPanel({ stock, onScan, onUndo, onAssign, onClose }) {
  const [mode, setMode] = useState('receive');
  const [quantity, setQuantity] = useState('1');
  const [code, setCode] = useState('');
  const [log, setLog] = useState([]);
  const [feedback, setFeedback] = useState(null); // { tone: 'success'|'error'|'unknown', text, code? }
  const [assignTo, setAssignTo] = useState('');
  const inputRef = useRef(null);

  const focusInput = () => inputRef.current && inputRef.current.focus();

  useEffect(() => {
    focusInput();
  }, [mode]);

  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const scanned = code.trim();
    if (!scanned) return;
    const result = onScan({ code: scanned, mode, quantity: qty });
    if (result.entry) {
      setLog((prev) => [result.entry, ...prev].slice(0, 30));
      const { entry } = result;
      setFeedback({
        tone: 'success',
        text: `${entry.name}: ${entry.delta > 0 ? '+' : '−'}${Math.abs(entry.delta)} ${entry.unit} → na stanie ${entry.newQuantity} ${entry.unit}.`,
      });
    } else if (result.unknown) {
      setFeedback({ tone: 'unknown', text: `Nieznany kod „${scanned}”.`, code: scanned });
      setAssignTo('');
    } else {
      setFeedback({ tone: 'error', text: result.error });
    }
    setCode('');
    focusInput();
  };

  const handleUndo = () => {
    const [last, ...rest] = log;
    if (!last) return;
    const error = onUndo(last);
    if (error) {
      setFeedback({ tone: 'error', text: error });
    } else {
      setLog(rest);
      setFeedback({ tone: 'success', text: `Cofnięto: ${last.name} (${last.delta > 0 ? '+' : '−'}${Math.abs(last.delta)} ${last.unit}).` });
    }
    focusInput();
  };

  const handleAssign = () => {
    if (!assignTo || !feedback?.code) return;
    const error = onAssign(assignTo, feedback.code);
    if (error) {
      setFeedback({ ...feedback, tone: 'unknown', text: error });
      return;
    }
    const item = stock.find((s) => String(s.id) === String(assignTo));
    setFeedback({ tone: 'success', text: `Kod „${feedback.code}” przypisano do: ${item ? item.name : 'produktu'}. Zeskanuj go ponownie.` });
    focusInput();
  };

  return (
    <section className="card scan-panel" aria-labelledby="scan-title">
      <div className="scan-head">
        <h2 id="scan-title" className="scan-title"><ScanLine aria-hidden="true" /> Skanowanie</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}><X /> Zamknij</button>
      </div>

      <form className="scan-form" onSubmit={handleSubmit}>
        <div className="segmented" role="radiogroup" aria-label="Rodzaj operacji">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'receive'}
            className={mode === 'receive' ? 'active' : ''}
            onClick={() => setMode('receive')}
          >
            Przyjęcie
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'issue'}
            className={mode === 'issue' ? 'active' : ''}
            onClick={() => setMode('issue')}
          >
            Wydanie
          </button>
        </div>
        <label className="scan-qty">
          <span className="field-label">Ilość</span>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="scan-code">
          <span className="field-label">Kod</span>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Zeskanuj albo wpisz kod i naciśnij Enter"
            autoComplete="off"
            spellCheck="false"
            className="code-input"
          />
        </label>
        <button type="submit" className="btn btn-primary">{mode === 'receive' ? 'Przyjmij' : 'Wydaj'}</button>
      </form>

      <p className="field-help muted">
        Czytniki kodów kreskowych, QR i RFID na USB działają jak klawiatura – wystarczy, że to pole ma kursor.
        W małym gabinecie wystarczą wydrukowane etykiety i zwykły czytnik (lub telefon); RFID na poziomie szuflad
        w dużym magazynie wymaga zamontowanych czytników.
      </p>

      {feedback && (
        <div className={`scan-feedback ${feedback.tone}`} role="status">
          <span>{feedback.text}</span>
          {feedback.tone === 'unknown' && feedback.code && stock.length > 0 && (
            <div className="scan-assign">
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} aria-label="Produkt, któremu przypisać kod">
                <option value="">Przypisz ten kod do produktu…</option>
                {stock.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAssign} disabled={!assignTo}>
                Przypisz
              </button>
            </div>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="scan-log">
          <div className="scan-log-head">
            <h3 className="section-label">Ostatnie skany</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleUndo}><Undo2 /> Cofnij ostatni</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Godzina</th>
                <th>Produkt</th>
                <th className="right">Zmiana</th>
                <th className="right">Stan</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry) => (
                <tr key={entry.id}>
                  <td className="num muted">{entry.time}</td>
                  <td>{entry.name}</td>
                  <td className={`right num ${entry.delta > 0 ? 'delta-plus' : 'delta-minus'}`}>
                    {entry.delta > 0 ? '+' : '−'}{Math.abs(entry.delta)}
                  </td>
                  <td className="right num">{entry.newQuantity} {entry.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ScanPanel;
