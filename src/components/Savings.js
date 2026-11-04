import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  KEYS,
  readJSON,
  getOrders,
  getPriceHistory,
  priceHistoryFor,
  orderLinesForReport,
  toCsv,
  stockLevel,
  getAlertLevel,
  STOCK_LEVEL_LABELS
} from '../utils/storage';
import { formatMoney } from '../utils/format';
import './Savings.css';

const DAY = 86400000;
const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const LINE_COLORS = ['#1d6b64', '#2d5b8a', '#b36b00', '#7a4e9c', '#b3261e', '#5b6460'];

const PRESETS = [
  { id: '30d', label: '30 dni', days: 30 },
  { id: '3m', label: '3 miesiące', days: 91 },
  { id: '12m', label: '12 miesięcy', days: 365 },
  { id: 'all', label: 'Cały okres', days: null }
];

const toInputDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const startOfDay = (value) => new Date(`${value}T00:00:00`);
const endOfDay = (value) => new Date(`${value}T23:59:59`);
const formatDate = (value) => new Date(value).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

const rangeForPreset = (preset, earliest) => {
  const today = new Date();
  const to = toInputDate(today);
  if (!preset.days) return { from: toInputDate(earliest || today), to };
  return { from: toInputDate(new Date(today.getTime() - (preset.days - 1) * DAY)), to };
};

const download = (rows, columns, fileName) => {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, fileName);
};

/** Wydatki w czasie: tygodnie dla krótkich okresów, miesiące dla dłuższych. */
function buildTimeline(orders, from, to, periodDays) {
  const byWeek = periodDays <= 62;
  const buckets = [];
  if (byWeek) {
    const start = new Date(from);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // poniedziałek
    for (let d = new Date(start); d <= to; d = new Date(d.getTime() + 7 * DAY)) {
      buckets.push({ start: new Date(d), end: new Date(d.getTime() + 7 * DAY - 1), label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, expenses: 0 });
    }
  } else {
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      buckets.push({
        start: new Date(d),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, -1),
        label: d.getMonth() === 0 || buckets.length === 0 ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : MONTHS[d.getMonth()],
        expenses: 0
      });
    }
  }
  orders.forEach((o) => {
    const d = new Date(o.date);
    const bucket = buckets.find((b) => d >= b.start && d <= b.end);
    if (bucket) bucket.expenses += o.amount || 0;
  });
  return { byWeek, data: buckets.map((b) => ({ label: b.label, expenses: Math.round(b.expenses * 100) / 100 })) };
}

/** „Ile produktu z kategorii w ostatnim okresie” */
function buildCategories(orders) {
  const map = {};
  orderLinesForReport(orders).forEach((line) => {
    const entry = (map[line.category] = map[line.category] || { category: line.category, quantity: 0, value: 0, products: new Set() });
    entry.quantity += line.quantity;
    entry.value += line.value;
    entry.products.add(line.product);
  });
  const list = Object.values(map).map((c) => ({ ...c, products: c.products.size }));
  const valueTotal = list.reduce((s, c) => s + c.value, 0);
  const quantityTotal = list.reduce((s, c) => s + c.quantity, 0);
  return list
    .map((c) => ({ ...c, share: valueTotal > 0 ? c.value / valueTotal : quantityTotal > 0 ? c.quantity / quantityTotal : 0 }))
    .sort((a, b) => b.value - a.value || b.quantity - a.quantity);
}

// Raport wydatków z historii zamówień i ofert, z wyborem okresu („fragmentator” jak w Power BI).
const Savings = () => {
  const [orders] = useState(() => getOrders());
  const [history] = useState(() => getPriceHistory());

  const earliest = useMemo(() => {
    const times = [...orders.map((o) => new Date(o.date).getTime()), ...history.map((h) => new Date(h.date).getTime())].filter(
      (t) => !Number.isNaN(t)
    );
    return times.length ? new Date(Math.min(...times)) : null;
  }, [orders, history]);

  const [presetId, setPresetId] = useState('3m');
  const [range, setRange] = useState(() => rangeForPreset(PRESETS[1], null));

  const choosePreset = (preset) => {
    setPresetId(preset.id);
    setRange(rangeForPreset(preset, earliest));
  };

  const changeRange = (field, value) => {
    if (!value) return;
    setPresetId('custom');
    setRange((prev) => ({ ...prev, [field]: value }));
  };

  const from = startOfDay(range.from);
  const to = endOfDay(range.to);
  const inRange = (value) => {
    const d = new Date(value);
    return d >= from && d <= to;
  };
  const periodDays = Math.max(1, Math.round((to - from) / DAY));

  const periodOrders = orders.filter((o) => inRange(o.date));
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(from.getTime() - periodDays * DAY);
  const previousOrders = orders.filter((o) => {
    const d = new Date(o.date);
    return d >= prevFrom && d <= prevTo;
  });

  const total = periodOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const previousTotal = previousOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const difference = total - previousTotal;
  const ordersWithValue = periodOrders.filter((o) => o.amount > 0);
  const average = ordersWithValue.length ? ordersWithValue.reduce((s, o) => s + o.amount, 0) / ordersWithValue.length : 0;

  const timeline = buildTimeline(periodOrders, from, to, periodDays);
  const categories = buildCategories(periodOrders);

  const supplierTotals = {};
  periodOrders.forEach((o) => {
    supplierTotals[o.supplier] = (supplierTotals[o.supplier] || 0) + (o.amount || 0);
  });
  const bySupplier = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1]);

  // Historia cen
  const productNames = useMemo(() => {
    const counts = {};
    history.forEach((h) => {
      counts[h.name] = (counts[h.name] || 0) + 1;
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, 'pl'));
  }, [history]);
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(() => productNames[0] || '');

  const productMatches = productQuery.trim()
    ? productNames.filter((n) => n.toLowerCase().includes(productQuery.trim().toLowerCase()))
    : productNames;

  const productHistory = useMemo(() => (selectedProduct ? priceHistoryFor(selectedProduct, history) : []), [selectedProduct, history]);
  const productHistoryInRange = productHistory.filter((h) => inRange(h.date));
  const priceSuppliers = [...new Set(productHistoryInRange.map((h) => h.supplier))];
  // Jeden punkt osi X na dzień – kilka ofert z tego samego dnia trafia do jednego wiersza.
  const priceChartData = Object.values(
    productHistoryInRange.reduce((rows, h) => {
      const key = String(h.date).slice(0, 10);
      rows[key] = { ...(rows[key] || { date: formatDate(h.date) }), [h.supplier]: h.price };
      return rows;
    }, {})
  );
  const lowest = productHistoryInRange.reduce((min, h) => (!min || h.price < min.price ? h : min), null);
  const highest = productHistoryInRange.reduce((max, h) => (!max || h.price > max.price ? h : max), null);
  const last = productHistoryInRange[productHistoryInRange.length - 1] || null;

  // Eksport dla Power BI – pełne dane; okres wybiera się w samym raporcie
  const exportOrderLines = () =>
    download(orderLinesForReport(orders), [
      { label: 'Id zamówienia', value: 'orderId' },
      { label: 'Data', value: 'date' },
      { label: 'Dostawca', value: 'supplier' },
      { label: 'Status', value: 'status' },
      { label: 'Produkt', value: 'product' },
      { label: 'Kategoria', value: 'category' },
      { label: 'Ilość', value: 'quantity' },
      { label: 'Cena jednostkowa', value: 'unitPrice' },
      { label: 'Wartość', value: 'value' }
    ], 'medident_pozycje_zamowien.csv');

  const exportPriceHistory = () =>
    download(getPriceHistory(), [
      { label: 'Data', value: (h) => String(h.date).slice(0, 10) },
      { label: 'Produkt', value: 'name' },
      { label: 'Dostawca', value: 'supplier' },
      { label: 'Cena', value: 'price' },
      { label: 'Źródło', value: 'source' }
    ], 'medident_historia_cen.csv');

  const exportStock = () =>
    download(readJSON(KEYS.inventory, []), [
      { label: 'Produkt', value: 'name' },
      { label: 'Kategoria', value: (i) => i.category || 'Inne' },
      { label: 'Stan', value: 'quantity' },
      { label: 'Jednostka', value: (i) => i.unit || 'szt' },
      { label: 'Minimum', value: (i) => i.minStock || 0 },
      { label: 'Próg ostrzegawczy', value: (i) => getAlertLevel(i) },
      { label: 'Status', value: (i) => STOCK_LEVEL_LABELS[stockLevel(i)] }
    ], 'medident_stan_magazynu.csv');

  const hasData = orders.length > 0 || history.length > 0;

  return (
    <div className="savings page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Raporty i wydatki</h1>
          <p className="page-subtitle">Liczone z historii zamówień i ofert.</p>
        </div>
      </header>

      {!hasData ? (
        <div className="empty-state">
          <h3>Brak danych</h3>
          <p>
            Raport powstaje z historii zamówień i ofert. Złóż pierwsze zamówienie z{' '}
            <Link to="/shopping-list">listy zakupów</Link> lub wyślij <Link to="/offers">zapytanie ofertowe</Link>.
          </p>
        </div>
      ) : (
        <>
          <div className="sav-slicer card">
            <div className="sav-presets" role="group" aria-label="Okres raportu">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`sav-preset ${presetId === p.id ? 'active' : ''}`}
                  aria-pressed={presetId === p.id}
                  onClick={() => choosePreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="sav-dates">
              <label>
                <span className="muted">Od</span>
                <input type="date" value={range.from} max={range.to} onChange={(e) => changeRange('from', e.target.value)} />
              </label>
              <label>
                <span className="muted">Do</span>
                <input type="date" value={range.to} min={range.from} onChange={(e) => changeRange('to', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="sav-stats">
            <div className="sav-stat">
              <span className="sav-stat-label">Wydatki w okresie</span>
              <span className="sav-stat-value num">{formatMoney(total)}</span>
            </div>
            <div className="sav-stat">
              <span className="sav-stat-label">Zamówień</span>
              <span className="sav-stat-value num">{periodOrders.length}</span>
            </div>
            <div className="sav-stat">
              <span className="sav-stat-label">Średnia wartość zamówienia</span>
              <span className="sav-stat-value num">{average > 0 ? formatMoney(average) : '—'}</span>
            </div>
            <div className="sav-stat">
              <span className="sav-stat-label">Zmiana względem poprzedniego okresu</span>
              <span className={`sav-stat-value num ${presetId === 'all' ? '' : difference > 0 ? 'up' : difference < 0 ? 'down' : ''}`}>
                {presetId === 'all' ? '—' : `${difference > 0 ? '+' : ''}${formatMoney(difference)}`}
              </span>
            </div>
          </div>

          <div className="sav-grid">
            <section className="card">
              <h2 className="section-label">Wydatki {timeline.byWeek ? 'tygodniowo' : 'miesięcznie'}</h2>
              <div className="sav-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={timeline.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#ecebe6" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#5b6460', fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#5b6460', fontSize: 12 }} width={56} />
                    <Tooltip
                      cursor={{ fill: '#f1f0eb' }}
                      contentStyle={{ border: '1px solid #e2e0d9', borderRadius: 6, fontSize: 13 }}
                      formatter={(value) => [formatMoney(value), 'Wydatki']}
                    />
                    <Bar dataKey="expenses" fill="#1d6b64" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card sav-suppliers">
              <h2 className="section-label">Według dostawców</h2>
              {bySupplier.length > 0 ? (
                <ul>
                  {bySupplier.map(([supplier, value]) => (
                    <li key={supplier}>
                      <span>{supplier}</span>
                      <span className={`num ${value > 0 ? '' : 'muted'}`}>{value > 0 ? formatMoney(value) : 'brak cen'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Brak zamówień w tym okresie.</p>
              )}
            </section>
          </div>

          <section className="card card-flush sav-section">
            <div className="sav-section-head sav-pad">
              <h2>Kategorie w okresie</h2>
              <span className="muted">Ile kupiono z każdej kategorii</span>
            </div>
            {categories.length > 0 ? (
              <div className="sav-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Kategoria</th>
                      <th className="right hide-narrow">Produktów</th>
                      <th className="right">Ilość</th>
                      <th className="right">Wartość</th>
                      <th className="sav-share-col">Udział</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.category}>
                        <td>{c.category}</td>
                        <td className="right num muted hide-narrow">{c.products}</td>
                        <td className="right num">{c.quantity}</td>
                        <td className="right num">{c.value > 0 ? formatMoney(c.value) : '—'}</td>
                        <td className="sav-share-col">
                          <span className="sav-share" aria-hidden="true">
                            <span className="sav-share-bar" style={{ width: `${Math.round(c.share * 100)}%` }} />
                          </span>
                          <span className="num muted sav-share-pct">{Math.round(c.share * 100)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sav-empty">Brak zamówień w tym okresie.</p>
            )}
          </section>

          <section className="card sav-section">
            <div className="sav-section-head">
              <h2>Historia cen</h2>
              <span className="muted">Ceny brutto z ofert i zamówień</span>
            </div>
            {productNames.length === 0 ? (
              <p className="muted">
                Historia cen powstaje z ofert wpisanych w <Link to="/offers">zapytaniach ofertowych</Link> i ze złożonych zamówień.
              </p>
            ) : (
              <>
                <div className="sav-product-picker">
                  <input
                    type="search"
                    placeholder="Szukaj produktu…"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    aria-label="Szukaj produktu w historii cen"
                  />
                  <select
                    value={productMatches.includes(selectedProduct) ? selectedProduct : ''}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    aria-label="Produkt"
                  >
                    {!productMatches.includes(selectedProduct) && <option value="">Wybierz produkt ({productMatches.length})</option>}
                    {productMatches.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {selectedProduct && productHistoryInRange.length === 0 && (
                  <p className="muted">
                    Brak cen tego produktu w wybranym okresie
                    {productHistory.length > 0 ? ` (w całej historii: ${productHistory.length}).` : '.'}
                  </p>
                )}

                {productHistoryInRange.length > 0 && (
                  <>
                    <dl className="sav-price-facts">
                      <div>
                        <dt>Ostatnia cena</dt>
                        <dd className="num sav-fact-value">{formatMoney(last.price)}</dd>
                        <dd className="muted">{last.supplier}, {formatDate(last.date)}</dd>
                      </div>
                      <div>
                        <dt>Najniższa</dt>
                        <dd className="num sav-fact-value">{formatMoney(lowest.price)}</dd>
                        <dd className="muted">{lowest.supplier}</dd>
                      </div>
                      <div>
                        <dt>Najwyższa</dt>
                        <dd className="num sav-fact-value">{formatMoney(highest.price)}</dd>
                        <dd className="muted">{highest.supplier}</dd>
                      </div>
                    </dl>

                    {productHistoryInRange.length > 1 && (
                      <div className="sav-chart">
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={priceChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#ecebe6" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#5b6460', fontSize: 12 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#5b6460', fontSize: 12 }} width={56} domain={['auto', 'auto']} tickFormatter={(v) => v.toLocaleString('pl-PL')} />
                            <Tooltip
                              contentStyle={{ border: '1px solid #e2e0d9', borderRadius: 6, fontSize: 13 }}
                              formatter={(value, name) => [formatMoney(value), name]}
                            />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                            {priceSuppliers.map((supplier, i) => (
                              <Line
                                key={supplier}
                                dataKey={supplier}
                                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                connectNulls
                                isAnimationActive={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div className="sav-table-wrap sav-table-bordered">
                      <table>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Dostawca</th>
                            <th className="hide-narrow">Źródło</th>
                            <th className="right">Cena / szt.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...productHistoryInRange].reverse().map((h, i) => (
                            <tr key={`${h.date}-${h.supplier}-${i}`}>
                              <td className="num">{formatDate(h.date)}</td>
                              <td>{h.supplier}</td>
                              <td className="muted hide-narrow">{h.source === 'zamówienie' ? 'Zamówienie' : 'Oferta'}</td>
                              <td className="right num">{formatMoney(h.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </>
      )}

      <section className="card sav-section">
        <div className="sav-section-head">
          <h2>Dane do Power BI</h2>
        </div>
        <p className="muted">
          Pełne dane jako pliki CSV. W Power BI: Pobierz dane → Tekst/CSV; po pobraniu nowszego pliku wystarczy Odśwież.
        </p>
        <div className="sav-export-buttons">
          <button type="button" className="btn btn-secondary" onClick={exportOrderLines} disabled={orders.length === 0}>
            <Download /> Pozycje zamówień
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportPriceHistory} disabled={history.length === 0}>
            <Download /> Historia cen
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportStock}>
            <Download /> Stan magazynu
          </button>
        </div>
      </section>
    </div>
  );
};

export default Savings;
