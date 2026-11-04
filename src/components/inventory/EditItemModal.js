import React, { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { getItemCode } from '../../utils/storage';
import { resizeImage } from './photo';

const UNITS = ['szt', 'opak', 'kpl', 'para', 'kg', 'l', 'ml', 'tuba', 'butelka'];

/**
 * Edycja pozycji magazynowej: nazwa, kategoria, jednostka, minimum, próg ostrzegawczy, kod, zdjęcie.
 * onSave(updatedItem) zwraca komunikat błędu (np. brak miejsca na zdjęcie) albo null.
 */
function EditItemModal({ item, stock, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item.name || '',
    category: item.category || 'Inne',
    unit: item.unit || 'szt',
    minStock: String(item.minStock ?? 5),
    alertLevel: String(Number.isFinite(item.alertLevel) && item.alertLevel > 0 ? item.alertLevel : (item.minStock || 0) * 2),
    code: getItemCode(item),
    photo: item.photo || null,
  });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const photo = await resizeImage(file);
      setForm((f) => ({ ...f, photo }));
      setErrors((er) => ({ ...er, photo: null }));
    } catch (err) {
      setErrors((er) => ({ ...er, photo: err.message }));
    } finally {
      setPhotoBusy(false);
    }
  };

  const validate = () => {
    const next = {};
    const min = Number(form.minStock);
    const alert = Number(form.alertLevel);
    if (!form.name.trim()) next.name = 'Podaj nazwę.';
    if (!Number.isInteger(min) || min < 0) next.minStock = 'Podaj liczbę całkowitą ≥ 0.';
    if (!Number.isInteger(alert) || alert < 0) next.alertLevel = 'Podaj liczbę całkowitą ≥ 0.';
    else if (!next.minStock && alert < min) next.alertLevel = 'Próg ostrzegawczy nie może być niższy niż minimum.';
    const code = form.code.trim();
    if (!code) next.code = 'Podaj kod.';
    else if (stock.some((s) => s.id !== item.id && getItemCode(s).toUpperCase() === code.toUpperCase())) {
      next.code = 'Ten kod ma już inny produkt.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const updated = {
      ...item,
      name: form.name.trim(),
      category: form.category.trim() || 'Inne',
      unit: form.unit,
      minStock: Number(form.minStock),
      alertLevel: Number(form.alertLevel),
      code: form.code.trim(),
      photo: form.photo || undefined,
    };
    const error = onSave(updated);
    if (error) setSaveError(error);
  };

  const fieldError = (name) => errors[name] && <span className="field-error">{errors[name]}</span>;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="edit-title">
        <h2 id="edit-title" className="modal-title">Edytuj produkt</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="edit-layout">
            <div className="edit-photo">
              {form.photo ? (
                <img src={form.photo} alt={`Zdjęcie: ${form.name}`} className="photo-large" />
              ) : (
                <div className="photo-placeholder">Brak zdjęcia</div>
              )}
              <div className="photo-actions">
                <label className="btn btn-secondary btn-sm">
                  <ImagePlus /> {form.photo ? 'Zmień' : 'Dodaj zdjęcie'}
                  <input type="file" accept="image/*" onChange={handlePhoto} hidden />
                </label>
                {form.photo && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, photo: null }))}>
                    <Trash2 /> Usuń
                  </button>
                )}
              </div>
              {photoBusy && <span className="muted field-help">Przetwarzanie zdjęcia…</span>}
              {fieldError('photo')}
            </div>

            <div className="edit-fields">
              <label className="field">
                <span className="field-label">Nazwa</span>
                <input type="text" value={form.name} onChange={set('name')} />
                {fieldError('name')}
              </label>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Kategoria</span>
                  <input type="text" value={form.category} onChange={set('category')} list="inventory-categories" />
                  <datalist id="inventory-categories">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </label>
                <label className="field">
                  <span className="field-label">Jednostka</span>
                  <select value={form.unit} onChange={set('unit')}>
                    {[...new Set([form.unit, ...UNITS])].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </label>
              </div>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Minimum</span>
                  <input type="number" min="0" value={form.minStock} onChange={set('minStock')} />
                  {fieldError('minStock')}
                </label>
                <label className="field">
                  <span className="field-label">Próg ostrzegawczy</span>
                  <input type="number" min="0" value={form.alertLevel} onChange={set('alertLevel')} />
                  {fieldError('alertLevel')}
                </label>
              </div>
              <p className="field-help muted">
                Poniżej progu ostrzegawczego pojawi się powiadomienie „kończy się”, zanim stan spadnie do minimum.
              </p>
              <label className="field">
                <span className="field-label">Kod (kreskowy / QR / RFID)</span>
                <input type="text" value={form.code} onChange={set('code')} className="code-input" />
                {fieldError('code')}
              </label>
            </div>
          </div>

          {saveError && <p className="form-error" role="alert">{saveError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Anuluj</button>
            <button type="submit" className="btn btn-primary" disabled={photoBusy}>Zapisz</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditItemModal;
