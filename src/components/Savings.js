import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getOrders } from '../utils/storage';
import './Savings.css';
import { formatMoney } from '../utils/format';

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
const formatPLN = (value) => `${formatMoney(value)}`;

// Raport wydatków liczony z historii zamówień (wcześniej strona pokazywała dane przykładowe).
const Savings = () => {
  const [orders] = useState(() => getOrders());

  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ year: d.getFullYear(), monthIndex: d.getMonth(), month: MONTHS[d.getMonth()], expenses: 0, count: 0 });
    }
    orders.forEach((order) => {
      const d = new Date(order.date);
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.monthIndex === d.getMonth());
      if (bucket) {
        bucket.expenses += order.amount || 0;
        bucket.count += 1;
      }
    });
    return buckets.map((b) => ({ ...b, expenses: Math.round(b.expenses * 100) / 100 }));
  }, [orders]);

  const bySupplier = useMemo(() => {
    const totals = {};
    orders.forEach((o) => {
      totals[o.supplier] = (totals[o.supplier] || 0) + (o.amount || 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  const difference = current.expenses - previous.expenses;
  const ordersWithValue = orders.filter((o) => o.amount > 0);
  const average = ordersWithValue.length
    ? ordersWithValue.reduce((sum, o) => sum + o.amount, 0) / ordersWithValue.length
    : 0;

  return (
    <div className="savings page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Wydatki gabinetu</h1>
          <p className="page-subtitle">Liczone z historii zamówień.</p>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>Brak danych</h3>
          <p>
            Raport powstaje z historii zamówień. Złóż pierwsze zamówienie z{' '}
            <Link to="/shopping-list">listy zakupów</Link> lub z <Link to="/offers">porównania ofert</Link>.
          </p>
        </div>
      ) : (
        <>
          <div className="sav-stats">
            <div className="sav-stat">
              <span className="sav-stat-label">Wydatki w tym miesiącu</span>
              <span className="sav-stat-value num">{formatPLN(current.expenses)}</span>
            </div>
            <div className="sav-stat">
              <span className="sav-stat-label">Zmiana względem poprzedniego miesiąca</span>
              <span className={`sav-stat-value num ${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}`}>
                {difference > 0 ? '+' : ''}
                {formatPLN(difference)}
              </span>
            </div>
            <div className="sav-stat">
              <span className="sav-stat-label">Średnia wartość zamówienia</span>
              <span className="sav-stat-value num">{average > 0 ? formatPLN(average) : '—'}</span>
            </div>
          </div>

          <div className="sav-grid">
            <section className="card">
              <h2 className="section-label">Wydatki miesięczne – ostatnie 6 miesięcy</h2>
              <div className="sav-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#ecebe6" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#5b6460', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#5b6460', fontSize: 12 }} width={48} />
                    <Tooltip
                      cursor={{ fill: '#f1f0eb' }}
                      contentStyle={{ border: '1px solid #e2e0d9', borderRadius: 6, fontSize: 13 }}
                      formatter={(value) => [formatPLN(value), 'Wydatki']}
                    />
                    <Bar dataKey="expenses" fill="#1d6b64" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card sav-suppliers">
              <h2 className="section-label">Według dostawców</h2>
              <ul>
                {bySupplier.map(([supplier, total]) => (
                  <li key={supplier}>
                    <span>{supplier}</span>
                    <span className={`num ${total > 0 ? '' : 'muted'}`}>{total > 0 ? formatPLN(total) : 'brak cen'}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Savings;
