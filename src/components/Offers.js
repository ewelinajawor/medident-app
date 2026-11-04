import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Send, Phone, Mail, Gift, Check, X, ShoppingCart } from "lucide-react";
import "./Offers.css";
import { formatMoney } from "../utils/format";
import { KEYS, readJSON, getSuppliers, getClosedLists, listTitle } from "../utils/storage";
import {
  getRfqs,
  updateRfq,
  rfqProgress,
  isOverdue,
  analyzeRfq,
  lineCost,
  validateOffer,
  saveOffer,
  setSupplierStatus,
  selectionForSupplier,
  selectionTotal,
  placeOrdersFromRfq,
  buildReminderEmail,
  buildNegotiationEmail,
  RFQ_STATUSES,
  SUPPLIER_STATUSES,
} from "../utils/rfq";

const RFQ_BADGE = { open: "badge-info", analysis: "badge-warning", ordered: "badge-success", cancelled: "" };

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pl-PL");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const deadlineDate = (deadline) => new Date(`${deadline}T12:00:00`).toLocaleDateString("pl-PL");

const daysLabel = (days, overdue = false) => {
  if (days === null) return "";
  if (overdue || days < 0) return "po terminie";
  if (days === 0) return "dziś";
  if (days === 1) return "jutro";
  return `za ${days} dni`;
};

// Pola formularza przyjmują przecinek dziesiętny.
const toNumber = (value) => {
  const n = Number(String(value ?? "").replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// 1 dostawca, 2–4 dostawców → „dostawcy”, 5+ „dostawców”
const suppliersWord = (n) => {
  if (n === 1) return "dostawca";
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "dostawcy" : "dostawców";
};

const emptyLine = { price: "", available: true, gratisQty: "", gratisDesc: "", gratisValue: "" };

const mailto = (to, subject, body) => {
  window.location.href = `mailto:${to || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const Offers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rfqId = searchParams.get("rfq");
  const [rfqs, setRfqs] = useState(() => getRfqs());
  const [message, setMessage] = useState(null); // { text, link? }
  const [offerForm, setOfferForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(false);

  const supplierDirectory = useMemo(() => Object.fromEntries(getSuppliers().map((s) => [s.name, s])), []);
  const listTitles = useMemo(() => Object.fromEntries(getClosedLists().map((l) => [l.id, listTitle(l)])), []);
  const clinicName = readJSON(KEYS.profile, {}).clinicName || "";

  const refresh = () => setRfqs(getRfqs());

  const showMessage = (text, link = null) => {
    setMessage({ text, link });
    setTimeout(() => setMessage((m) => (m && m.text === text ? null : m)), 6000);
  };

  const rfq = rfqId ? rfqs.find((r) => r.id === rfqId) : null;

  // ---------- Formularz oferty ----------

  const openOfferForm = (supplier) => {
    const lines = Object.fromEntries(
      rfq.items.map((item) => {
        const saved = supplier.offer?.lines?.[item.key];
        return [
          item.key,
          saved
            ? {
                price: saved.price ? String(saved.price).replace(".", ",") : "",
                available: saved.available !== false,
                gratisQty: saved.gratisQty ? String(saved.gratisQty) : "",
                gratisDesc: saved.gratisDesc || "",
                gratisValue: saved.gratisValue ? String(saved.gratisValue).replace(".", ",") : "",
              }
            : { ...emptyLine },
        ];
      })
    );
    setOfferForm({
      supplierName: supplier.name,
      lines,
      deliveryDays: supplier.offer?.deliveryDays ? String(supplier.offer.deliveryDays) : "",
      note: supplier.offer?.note || "",
    });
    setFormErrors({});
  };

  const updateLine = (key, changes) => {
    setOfferForm((form) => ({ ...form, lines: { ...form.lines, [key]: { ...form.lines[key], ...changes } } }));
    setFormErrors((errors) => {
      if (!errors[key]) return errors;
      const next = { ...errors };
      delete next[key];
      return next;
    });
  };

  const formToOffer = (form) => ({
    lines: Object.fromEntries(
      Object.entries(form.lines).map(([key, line]) => [
        key,
        line.available
          ? {
              price: toNumber(line.price),
              available: true,
              gratisQty: toNumber(line.gratisQty),
              gratisDesc: line.gratisDesc.trim(),
              gratisValue: toNumber(line.gratisValue),
            }
          : { available: false },
      ])
    ),
    deliveryDays: toNumber(form.deliveryDays) || null,
    note: form.note.trim(),
  });

  const handleSaveOffer = () => {
    const offer = formToOffer(offerForm);
    const errors = validateOffer(rfq, offer);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    saveOffer(rfq.id, offerForm.supplierName, offer);
    refresh();
    showMessage(`Zapisano ofertę: ${offerForm.supplierName}.`);
    setOfferForm(null);
  };

  // ---------- Akcje na dostawcach ----------

  const handleRemind = (supplier) => {
    setSupplierStatus(rfq.id, supplier.name, { lastContactAt: new Date().toISOString() });
    refresh();
    mailto(
      supplier.email,
      `Przypomnienie: zapytanie ofertowe nr ${rfq.number}${clinicName ? ` – ${clinicName}` : ""}`,
      buildReminderEmail({ clinicName, rfq })
    );
  };

  const handleCalled = (supplier) => {
    setSupplierStatus(rfq.id, supplier.name, { lastContactAt: new Date().toISOString() });
    refresh();
    showMessage(`Zapisano kontakt telefoniczny: ${supplier.name}.`);
  };

  const handleDeclined = (supplier) => {
    updateRfq(rfq.id, (r) => {
      const suppliers = r.suppliers.map((s) => (s.name === supplier.name ? { ...s, status: "declined" } : s));
      const allIn = suppliers.every((s) => s.status !== "pending");
      return { ...r, suppliers, status: r.status === "open" && allIn ? "analysis" : r.status };
    });
    refresh();
  };

  const handleNegotiate = (supplier) => {
    const body = buildNegotiationEmail({ clinicName, rfq, supplierName: supplier.name });
    if (!body) return;
    setSupplierStatus(rfq.id, supplier.name, { lastContactAt: new Date().toISOString() });
    refresh();
    mailto(supplier.email, `Oferta do zapytania nr ${rfq.number} – prośba o lepsze warunki`, body);
  };

  // ---------- Analiza i wybór ----------

  const setSelection = (selection) => {
    updateRfq(rfq.id, { selection });
    refresh();
  };

  const toggleGratis = (includeGratis) => {
    updateRfq(rfq.id, { includeGratis });
    refresh();
  };

  const handlePlaceOrders = () => {
    const orders = placeOrdersFromRfq(rfq.id);
    refresh();
    showMessage(`Złożono ${orders.length} zamówień: ${orders.map((o) => o.supplier).join(", ")}.`, "/orders");
  };

  const handleCancel = () => {
    updateRfq(rfq.id, { status: "cancelled" });
    setConfirmCancel(false);
    refresh();
  };

  const notice = message && (
    <div className="notice" role="status">
      <span>{message.text}</span>
      {message.link && (
        <Link to={message.link} className="of-notice-link">
          Zobacz zamówienia
        </Link>
      )}
    </div>
  );

  // =================== Lista zapytań ===================
  if (!rfq) {
    const sorted = [...rfqs].sort((a, b) => {
      const activeA = a.status === "open" || a.status === "analysis" ? 0 : 1;
      const activeB = b.status === "open" || b.status === "analysis" ? 0 : 1;
      return activeA - activeB || b.number - a.number;
    });

    return (
      <div className="offers page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Zapytania ofertowe</h1>
            <p className="page-subtitle">Kto już przysłał ofertę, kto się spóźnia i które zamówienie wychodzi najtaniej.</p>
          </div>
          <Link to="/shopping-list" className="btn btn-primary">
            <Plus /> Nowe zapytanie
          </Link>
        </header>

        {notice}
        {rfqId && <div className="notice of-notice-warn">Nie znaleziono tego zapytania – pokazuję wszystkie.</div>}

        {sorted.length === 0 ? (
          <div className="empty-state">
            <h3>Nie ma jeszcze zapytań ofertowych</h3>
            <p>
              Zbierz produkty na liście zakupów i wybierz „Zamknij listę i wyślij zapytanie”. Tutaj wpiszesz oferty,
              które przyślą dostawcy, a aplikacja wskaże najtańszy wariant.
            </p>
            <Link to="/shopping-list" className="btn btn-primary">Przejdź do listy zakupów</Link>
          </div>
        ) : (
          <section className="card card-flush">
            <div className="table-wrap">
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Zapytanie</th>
                    <th>Termin ofert</th>
                    <th>Oferty</th>
                    <th>Status</th>
                    <th aria-label="Akcje"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => {
                    const progress = rfqProgress(r);
                    const active = r.status === "open" || r.status === "analysis";
                    return (
                      <tr key={r.id} className="of-row-link" onClick={() => setSearchParams({ rfq: r.id })}>
                        <td>
                          <span className="of-strong">Nr {r.number}</span>
                          <span className="of-meta">
                            {formatDate(r.createdAt)} · {r.items.length} poz.
                            {r.listId && listTitles[r.listId] && ` · ${listTitles[r.listId]}`}
                          </span>
                        </td>
                        <td className="of-nowrap">
                          <span className="num">{deadlineDate(r.deadline)}</span>
                          {active && (
                            progress.overdue.length > 0 ? (
                              <span className="badge badge-danger of-ml">Po terminie</span>
                            ) : (
                              <span className="of-meta">{daysLabel(progress.daysLeft, isOverdue(r))}</span>
                            )
                          )}
                        </td>
                        <td className="of-nowrap">
                          <span className="num">Otrzymano {progress.received} z {progress.total}</span>
                          <span className="of-progress" aria-hidden="true">
                            <span style={{ width: `${progress.total ? (progress.received / progress.total) * 100 : 0}%` }} />
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${RFQ_BADGE[r.status] || ""}`}>{RFQ_STATUSES[r.status]}</span>
                        </td>
                        <td className="right">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchParams({ rfq: r.id });
                            }}
                          >
                            Otwórz
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    );
  }

  // =================== Szczegóły zapytania ===================
  const progress = rfqProgress(rfq);
  const overdue = isOverdue(rfq);
  const editable = rfq.status === "open" || rfq.status === "analysis";
  const includeGratis = rfq.includeGratis !== false;
  const analysis = analyzeRfq(rfq, includeGratis);
  const offered = rfq.suppliers.filter((s) => s.status === "received" && s.offer);
  const selection = rfq.selection || {};
  const chosenTotal = selectionTotal(rfq, selection, includeGratis);
  const chosenSuppliers = [...new Set(rfq.items.map((i) => selection[i.key]).filter(Boolean))];
  const unselected = rfq.items.filter((i) => !selection[i.key]);
  const totalsBySupplier = Object.fromEntries(analysis.perSupplier.map((s) => [s.name, s]));
  const incomplete = analysis.perSupplier.filter((s) => !s.complete);

  const supplierBadge = (supplier) => {
    if (supplier.status === "pending" && overdue && editable) {
      return <span className="badge badge-danger">Po terminie – zadzwoń</span>;
    }
    const cls = supplier.status === "received" ? "badge-success" : supplier.status === "declined" ? "" : "badge-info";
    return <span className={`badge ${cls}`}>{SUPPLIER_STATUSES[supplier.status]}</span>;
  };

  return (
    <div className="offers page">
      <button type="button" className="btn btn-ghost btn-sm of-back" onClick={() => setSearchParams({})}>
        <ArrowLeft /> Wszystkie zapytania
      </button>

      <header className="page-header">
        <div>
          <h1 className="page-title">
            Zapytanie ofertowe nr {rfq.number}{" "}
            <span className={`badge ${RFQ_BADGE[rfq.status] || ""} of-title-badge`}>{RFQ_STATUSES[rfq.status]}</span>
          </h1>
          <p className="page-subtitle">
            Wysłane {formatDate(rfq.createdAt)}
            {rfq.listId && listTitles[rfq.listId] && ` · ${listTitles[rfq.listId]}`}
          </p>
        </div>
        {editable && (
          confirmCancel ? (
            <div className="of-inline-confirm">
              <span>Anulować zapytanie?</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleCancel}>Anuluj zapytanie</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)}>Nie</button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmCancel(true)}>
              Anuluj zapytanie
            </button>
          )
        )}
      </header>

      {notice}

      <div className="of-stats">
        <div className="of-stat">
          <span className="of-stat-label">Oferty</span>
          <span className="of-stat-value num">Otrzymano {progress.received} z {progress.total}</span>
          {progress.declined > 0 && <span className="of-meta">{progress.declined} odmów</span>}
        </div>
        <div className={`of-stat ${overdue && progress.pending > 0 && editable ? "danger" : ""}`}>
          <span className="of-stat-label">Termin ofert</span>
          <span className="of-stat-value num">{deadlineDate(rfq.deadline)}</span>
          {editable && <span className="of-meta">{daysLabel(progress.daysLeft, overdue)}</span>}
        </div>
        <div className="of-stat">
          <span className="of-stat-label">Najtańszy dostawca</span>
          <span className="of-stat-value num">
            {analysis.cheapestSupplier ? formatMoney(analysis.cheapestSupplier.total) : "—"}
          </span>
          <span className="of-meta">
            {analysis.cheapestSupplier ? analysis.cheapestSupplier.name : offered.length ? "nikt nie ma wszystkich pozycji" : "brak ofert"}
          </span>
        </div>
        <div className="of-stat">
          <span className="of-stat-label">Optymalny podział</span>
          <span className="of-stat-value num">{offered.length ? formatMoney(analysis.optimal.total) : "—"}</span>
          <span className="of-meta">
            {analysis.savings > 0 ? `taniej o ${formatMoney(analysis.savings)}` : offered.length ? `${analysis.optimal.suppliers.length} ${suppliersWord(analysis.optimal.suppliers.length)}` : ""}
          </span>
        </div>
      </div>

      {rfq.status === "ordered" && (
        <div className="notice">
          <Check /> Zamówienia złożono {formatDate(rfq.orderedAt)} ({chosenSuppliers.join(", ")}).
          <Link to="/orders" className="of-notice-link">Zobacz zamówienia</Link>
        </div>
      )}

      {/* Dostawcy */}
      <section className="card card-flush of-section">
        <div className="of-section-head">
          <h3>Dostawcy</h3>
          {editable && progress.overdue.length > 0 && (
            <span className="of-meta of-warn">Minął termin – brak oferty od: {progress.overdue.join(", ")}</span>
          )}
        </div>
        <div className="table-wrap">
          <table className="of-table">
            <thead>
              <tr>
                <th>Dostawca</th>
                <th>Status</th>
                <th>Oferta</th>
                <th>Ostatni kontakt</th>
                <th className="right">Suma oferty</th>
                <th aria-label="Akcje"></th>
              </tr>
            </thead>
            <tbody>
              {rfq.suppliers.map((supplier) => {
                const directory = supplierDirectory[supplier.name] || {};
                const total = totalsBySupplier[supplier.name];
                const canNegotiate =
                  supplier.status === "received" && editable && Boolean(buildNegotiationEmail({ clinicName, rfq, supplierName: supplier.name }));
                return (
                  <tr key={supplier.name}>
                    <td>
                      <span className="of-strong">{supplier.name}</span>
                      <span className="of-meta">{supplier.email || directory.email || "brak e-maila"}</span>
                      {directory.phone && <span className="of-meta of-nowrap">tel. {directory.phone}</span>}
                    </td>
                    <td>{supplierBadge(supplier)}</td>
                    <td className="num of-nowrap">
                      {supplier.receivedAt ? formatDateTime(supplier.receivedAt) : "—"}
                      {supplier.offer?.deliveryDays && <span className="of-meta">dostawa {supplier.offer.deliveryDays} dni</span>}
                    </td>
                    <td className="num of-nowrap">{formatDateTime(supplier.lastContactAt)}</td>
                    <td className="right num of-nowrap">
                      {total ? formatMoney(total.total) : "—"}
                      {total && total.missing > 0 && <span className="of-meta">bez {total.missing} poz.</span>}
                    </td>
                    <td className="right">
                      <div className="of-actions">
                        {editable && supplier.status !== "declined" && (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openOfferForm(supplier)}>
                            {supplier.status === "received" ? "Edytuj ofertę" : "Wpisz ofertę"}
                          </button>
                        )}
                        {editable && supplier.status === "pending" && (
                          <>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRemind(supplier)} title="Wyślij przypomnienie e-mailem">
                              <Mail /> Przypomnij
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleCalled(supplier)} title="Zapisz, że był telefon">
                              <Phone /> Zadzwoniono
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDeclined(supplier)}>
                              Odmówił
                            </button>
                          </>
                        )}
                        {canNegotiate && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleNegotiate(supplier)}
                            title="E-mail z lepszymi cenami konkurencji"
                          >
                            Negocjuj
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Analiza */}
      {offered.length === 0 ? (
        <section className="card card-flush of-section">
          <div className="of-section-head">
            <h3>Pozycje w zapytaniu</h3>
            <span className="of-meta">Analiza pojawi się po wpisaniu pierwszej oferty.</span>
          </div>
          <div className="table-wrap">
            <table className="of-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Kategoria</th>
                  <th className="right">Ilość</th>
                </tr>
              </thead>
              <tbody>
                {rfq.items.map((item) => (
                  <tr key={item.key}>
                    <td>{item.name}</td>
                    <td className="muted">{item.category}</td>
                    <td className="right num">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card card-flush of-section">
          <div className="of-section-head">
            <div>
              <h3>Analiza ofert</h3>
              <span className="of-meta">
                Zaznacz u kogo zamawiasz każdą pozycję. Najtańsza oferta w wierszu jest wyróżniona.
              </span>
            </div>
            <div className="of-toolbar">
              <label className="of-check">
                <input
                  type="checkbox"
                  checked={includeGratis}
                  disabled={!editable}
                  onChange={(e) => toggleGratis(e.target.checked)}
                />
                Uwzględnij gratisy
              </label>
              {editable && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={!analysis.cheapestSupplier}
                    onClick={() => setSelection(selectionForSupplier(rfq, analysis.cheapestSupplier.name))}
                    title={analysis.cheapestSupplier ? "" : "Żaden dostawca nie ma wszystkich pozycji"}
                  >
                    Wybierz najtańszego dostawcę
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelection(analysis.optimal.selection)}>
                    Wybierz najtańsze produkty
                  </button>
                  {Object.keys(selection).length > 0 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelection({})}>
                      Wyczyść wybór
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {incomplete.length > 0 && (
            <p className="of-info">
              Niepełne oferty: {incomplete.map((s) => `${s.name} (bez ${s.missing} poz.)`).join(", ")}.
              {analysis.uncovered.length > 0 && ` Nikt nie zaoferował: ${analysis.uncovered.join(", ")}.`}
            </p>
          )}

          <div className="table-wrap">
            <table className="of-table of-matrix">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th className="right">Ilość</th>
                  {offered.map((s) => (
                    <th key={s.name} className="of-supplier-col">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.perItem.map((item) => (
                  <tr key={item.key}>
                    <td className="of-item-name">{item.name}</td>
                    <td className="right num">{item.quantity}</td>
                    {offered.map((s) => {
                      const line = s.offer.lines?.[item.key];
                      const cost = lineCost(line, item.quantity, includeGratis);
                      const isBest = item.best && item.best.supplier === s.name;
                      const selected = selection[item.key] === s.name;
                      if (cost === null) {
                        return (
                          <td key={s.name} className="of-cell of-cell-missing">
                            <span className="muted">brak</span>
                          </td>
                        );
                      }
                      const hasGratis = Number(line.gratisQty) > 0 || line.gratisDesc;
                      return (
                        <td key={s.name} className={`of-cell ${isBest ? "of-best" : ""} ${selected ? "of-selected" : ""}`}>
                          <label className="of-cell-label">
                            <input
                              type="radio"
                              name={`sel-${item.key}`}
                              checked={selected}
                              disabled={!editable}
                              onChange={() => setSelection({ ...selection, [item.key]: s.name })}
                              aria-label={`${item.name}: ${s.name}`}
                            />
                            <span className="of-cell-values">
                              <span className="num of-cell-total">{formatMoney(cost)}</span>
                              <span className="num of-meta">{formatMoney(Number(line.price))}/szt.</span>
                              {hasGratis && (
                                <span className="badge badge-accent of-gratis" title={`Wartość gratisu: ${formatMoney(Number(line.gratisValue) || 0)}`}>
                                  <Gift /> {line.gratisQty ? `${line.gratisQty} szt.` : ""} {line.gratisDesc}
                                  {" · "}
                                  {formatMoney(Number(line.gratisValue) || 0)}
                                </span>
                              )}
                              {isBest && <span className="of-best-label">najtaniej</span>}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Razem u dostawcy</td>
                  {offered.map((s) => {
                    const total = totalsBySupplier[s.name];
                    return (
                      <td key={s.name} className="num">
                        {formatMoney(total.total)}
                        {total.missing > 0 && <span className="of-meta">bez {total.missing} poz.</span>}
                        {editable && (
                          <button
                            type="button"
                            className="of-link-btn"
                            onClick={() => setSelection(selectionForSupplier(rfq, s.name))}
                          >
                            Zaznacz wszystko u {s.name}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="of-footer">
            <div className="of-footer-summary">
              <span className="of-stat-label">Twój wybór</span>
              <span className="of-footer-total num">{formatMoney(chosenTotal)}</span>
              <span className="of-meta">
                {chosenSuppliers.length > 0 ? chosenSuppliers.join(", ") : "nic nie zaznaczono"}
                {includeGratis ? " · po odjęciu gratisów" : ""}
              </span>
              {unselected.length > 0 && Object.keys(selection).length > 0 && (
                <span className="of-meta of-warn">
                  Bez dostawcy: {unselected.map((i) => i.name).join(", ")} – te pozycje nie zostaną zamówione.
                </span>
              )}
            </div>
            {editable && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={chosenSuppliers.length === 0}
                onClick={handlePlaceOrders}
              >
                <ShoppingCart /> Złóż zamówienia ({chosenSuppliers.length} {suppliersWord(chosenSuppliers.length)})
              </button>
            )}
          </div>
        </section>
      )}

      {/* Formularz oferty */}
      {offerForm && (
        <div className="modal-backdrop" onClick={() => setOfferForm(null)}>
          <div className="of-modal" role="dialog" aria-modal="true" aria-labelledby="of-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="of-modal-head">
              <div>
                <h3 id="of-modal-title">Oferta: {offerForm.supplierName}</h3>
                <span className="of-meta">Zapytanie nr {rfq.number} · ceny brutto za sztukę</span>
              </div>
              <button type="button" className="of-icon-btn" onClick={() => setOfferForm(null)} aria-label="Zamknij">
                <X />
              </button>
            </div>

            <div className="table-wrap">
              <table className="of-table of-form-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th className="right">Cena brutto / szt.</th>
                    <th>Brak</th>
                    <th className="right">Gratis – ilość</th>
                    <th>Gratis – opis</th>
                    <th className="right">Wartość gratisu</th>
                    <th className="right">Razem</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.items.map((item) => {
                    const line = offerForm.lines[item.key];
                    const parsed = line.available
                      ? { price: toNumber(line.price), gratisValue: toNumber(line.gratisValue), available: true }
                      : { available: false };
                    const total = lineCost(parsed, item.quantity, includeGratis);
                    const error = formErrors[item.key];
                    const gratisGiven = toNumber(line.gratisQty) > 0 || line.gratisDesc.trim();
                    return (
                      <React.Fragment key={item.key}>
                        <tr className={error ? "of-error-row" : ""}>
                          <td>
                            <span className="of-strong">{item.name}</span>
                            <span className="of-meta">{item.quantity} szt.</span>
                          </td>
                          <td className="right">
                            <input
                              type="text"
                              inputMode="decimal"
                              className="of-input-num"
                              value={line.price}
                              disabled={!line.available}
                              onChange={(e) => updateLine(item.key, { price: e.target.value })}
                              placeholder="0,00"
                              aria-label={`Cena brutto: ${item.name}`}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={!line.available}
                              onChange={(e) => updateLine(item.key, { available: !e.target.checked })}
                              aria-label={`Dostawca nie ma: ${item.name}`}
                            />
                          </td>
                          <td className="right">
                            <input
                              type="number"
                              min="0"
                              className="of-input-qty"
                              value={line.gratisQty}
                              disabled={!line.available}
                              onChange={(e) => updateLine(item.key, { gratisQty: e.target.value })}
                              aria-label={`Ilość gratisu: ${item.name}`}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="of-input-text"
                              value={line.gratisDesc}
                              disabled={!line.available}
                              onChange={(e) => updateLine(item.key, { gratisDesc: e.target.value })}
                              placeholder="np. 2 op. gratis"
                              aria-label={`Opis gratisu: ${item.name}`}
                            />
                          </td>
                          <td className="right">
                            <input
                              type="text"
                              inputMode="decimal"
                              className={`of-input-num ${gratisGiven && !(toNumber(line.gratisValue) > 0) ? "of-input-required" : ""}`}
                              value={line.gratisValue}
                              disabled={!line.available}
                              onChange={(e) => updateLine(item.key, { gratisValue: e.target.value })}
                              placeholder={gratisGiven ? "wymagane" : "0,00"}
                              aria-label={`Wartość gratisu w zł: ${item.name}`}
                            />
                          </td>
                          <td className="right num of-nowrap">{total !== null ? formatMoney(total) : <span className="muted">—</span>}</td>
                        </tr>
                        {error && (
                          <tr className="of-error-msg">
                            <td colSpan={7}>{error}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="of-form-extra">
              <label className="of-field">
                <span>Czas dostawy (dni)</span>
                <input
                  type="number"
                  min="0"
                  value={offerForm.deliveryDays}
                  onChange={(e) => setOfferForm((f) => ({ ...f, deliveryDays: e.target.value }))}
                />
              </label>
              <label className="of-field of-field-wide">
                <span>Uwagi do oferty</span>
                <input
                  type="text"
                  value={offerForm.note}
                  onChange={(e) => setOfferForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="np. ważna do końca miesiąca"
                />
              </label>
            </div>

            {Object.keys(formErrors).length > 0 && (
              <p className="of-form-error">Uzupełnij zaznaczone pozycje: każda musi mieć cenę albo „brak”, a gratis – swoją wartość.</p>
            )}

            <div className="of-modal-actions">
              <span className="of-meta">
                {includeGratis ? "„Razem” uwzględnia odjęcie wartości gratisu." : "Gratisy nie są uwzględniane w sumach."}
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => setOfferForm(null)}>Anuluj</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveOffer}>
                <Send /> Zapisz ofertę
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;
