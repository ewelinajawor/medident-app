import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Printer, X } from 'lucide-react';
import { getItemCode } from '../../utils/storage';

function Label({ item }) {
  const barcodeRef = useRef(null);
  const [qr, setQr] = useState(null);
  const [barcodeError, setBarcodeError] = useState(false);
  const code = getItemCode(item);

  useEffect(() => {
    try {
      JsBarcode(barcodeRef.current, code, {
        format: 'CODE128',
        height: 38,
        width: 1.4,
        margin: 0,
        displayValue: true,
        fontSize: 11,
        font: 'IBM Plex Mono, monospace',
        textMargin: 2,
      });
      setBarcodeError(false);
    } catch {
      setBarcodeError(true); // np. znaki spoza Code128
    }
    let active = true;
    QRCode.toDataURL(code, { margin: 0, width: 160, errorCorrectionLevel: 'M' })
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(null));
    return () => { active = false; };
  }, [code]);

  return (
    <div className="label">
      <div className="label-text">
        <span className="label-name">{item.name}</span>
        <span className="label-meta">{item.category}{item.unit ? ` · ${item.unit}` : ''}</span>
        {barcodeError ? (
          <span className="label-code">{code}</span>
        ) : (
          <svg ref={barcodeRef} className="label-barcode" role="img" aria-label={`Kod kreskowy ${code}`} />
        )}
      </div>
      {qr && <img src={qr} alt={`Kod QR ${code}`} className="label-qr" />}
    </div>
  );
}

/** Arkusz etykiet do druku – renderowany poza aplikacją, żeby wydruk zawierał tylko etykiety. */
function LabelSheet({ items, onClose }) {
  useEffect(() => {
    document.body.classList.add('md-labels-open');
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('md-labels-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="label-sheet" role="dialog" aria-modal="true" aria-labelledby="labels-title">
      <div className="label-toolbar">
        <div>
          <h2 id="labels-title" className="label-title">Etykiety ({items.length})</h2>
          <p className="muted">Kod kreskowy i QR zawierają ten sam kod. Drukuj na papierze A4 lub arkuszu etykiet.</p>
        </div>
        <div className="label-toolbar-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}><X /> Zamknij</button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer /> Drukuj</button>
        </div>
      </div>
      <div className="label-grid">
        {items.map((item) => <Label key={item.id} item={item} />)}
      </div>
    </div>,
    document.body
  );
}

export default LabelSheet;
