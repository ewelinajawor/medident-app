import {
  createRfq,
  getRfq,
  saveOffer,
  rfqProgress,
  analyzeRfq,
  validateOffer,
  lineCost,
  selectionForSupplier,
  selectionTotal,
  updateRfq,
  placeOrdersFromRfq,
  buildNegotiationEmail,
} from './rfq';
import {
  getOrders,
  getPriceHistory,
  priceHistoryFor,
  stockLevel,
  buildListFromStock,
  closeShoppingList,
  getClosedLists,
  listTitle,
  findStockByCode,
  getItemCode,
  readJSON,
  KEYS,
  toCsv,
  orderLinesForReport,
} from './storage';
import { buildNotifications } from './notifications';

beforeEach(() => localStorage.clear());

const ITEMS = [
  { name: 'Rękawice M', category: 'Ochrona', quantity: 10 },
  { name: 'Igły', category: 'Znieczulenia', quantity: 5 },
];
const SUPPLIERS = [
  { name: 'Koldental', email: 'k@x.pl' },
  { name: 'Meditrans', email: 'm@x.pl' },
  { name: 'Marrodent', email: 'r@x.pl' },
];

const offer = (lines) => ({ lines, deliveryDays: 2 });

describe('zapytania ofertowe', () => {
  test('postęp: „otrzymano 1 z 3” i spóźnieni po terminie', () => {
    const rfq = createRfq({ items: ITEMS, suppliers: SUPPLIERS, deadline: '2026-11-10' });
    saveOffer(rfq.id, 'Koldental', offer({ 'rękawice m': { price: 20 }, 'igły': { price: 3 } }));
    const before = rfqProgress(getRfq(rfq.id), new Date('2026-11-10T20:00:00'));
    expect(before).toMatchObject({ received: 1, total: 3, overdue: [] });
    const after = rfqProgress(getRfq(rfq.id), new Date('2026-11-11T08:00:00'));
    expect(after.overdue).toEqual(['Meditrans', 'Marrodent']);
  });

  test('status przechodzi na „do analizy”, gdy wszyscy odpowiedzieli', () => {
    const rfq = createRfq({ items: ITEMS, suppliers: SUPPLIERS.slice(0, 2), deadline: '2026-11-10' });
    saveOffer(rfq.id, 'Koldental', offer({ 'rękawice m': { price: 20 }, 'igły': { price: 3 } }));
    expect(getRfq(rfq.id).status).toBe('open');
    saveOffer(rfq.id, 'Meditrans', offer({ 'rękawice m': { price: 18 }, 'igły': { price: 4 } }));
    expect(getRfq(rfq.id).status).toBe('analysis');
  });

  test('gratis bez wartości jest błędem, brak pozycji – nie', () => {
    const rfq = createRfq({ items: ITEMS, suppliers: SUPPLIERS, deadline: '2026-11-10' });
    const errors = validateOffer(rfq, { lines: { 'rękawice m': { price: 20, gratisQty: 2 }, 'igły': { available: false } } });
    expect(Object.keys(errors)).toEqual(['rękawice m']);
  });

  test('koszt pozycji uwzględnia wartość gratisu tylko gdy włączone', () => {
    expect(lineCost({ price: 20, gratisValue: 30 }, 10, true)).toBe(170);
    expect(lineCost({ price: 20, gratisValue: 30 }, 10, false)).toBe(200);
    expect(lineCost({ available: false, price: 20 }, 10)).toBeNull();
  });

  test('analiza: najtańszy dostawca vs optymalny podział', () => {
    const rfq = createRfq({ items: ITEMS, suppliers: SUPPLIERS, deadline: '2026-11-10' });
    saveOffer(rfq.id, 'Koldental', offer({ 'rękawice m': { price: 20 }, 'igły': { price: 3 } })); // 215
    saveOffer(rfq.id, 'Meditrans', offer({ 'rękawice m': { price: 18 }, 'igły': { price: 5 } })); // 205
    saveOffer(rfq.id, 'Marrodent', offer({ 'rękawice m': { price: 17 }, 'igły': { available: false } })); // niepełna
    const a = analyzeRfq(getRfq(rfq.id));
    expect(a.cheapestSupplier).toMatchObject({ name: 'Meditrans', total: 205 });
    expect(a.optimal.selection).toEqual({ 'rękawice m': 'Marrodent', 'igły': 'Koldental' });
    expect(a.optimal.total).toBe(185);
    expect(a.savings).toBe(20);
    expect(a.perSupplier.find((s) => s.name === 'Marrodent')).toMatchObject({ missing: 1, complete: false });
  });

  test('gratis potrafi zmienić zwycięzcę', () => {
    const rfq = createRfq({ items: [ITEMS[0]], suppliers: SUPPLIERS.slice(0, 2), deadline: '2026-11-10' });
    saveOffer(rfq.id, 'Koldental', offer({ 'rękawice m': { price: 20, gratisQty: 2, gratisDesc: '2 op.', gratisValue: 40 } })); // 160
    saveOffer(rfq.id, 'Meditrans', offer({ 'rękawice m': { price: 18 } })); // 180
    expect(analyzeRfq(getRfq(rfq.id), true).cheapestSupplier.name).toBe('Koldental');
    expect(analyzeRfq(getRfq(rfq.id), false).cheapestSupplier.name).toBe('Meditrans');
  });

  test('zaznaczenie dostawcy i złożenie zamówień dzieli je per dostawca', () => {
    const rfq = createRfq({ items: ITEMS, suppliers: SUPPLIERS.slice(0, 2), deadline: '2026-11-10' });
    saveOffer(rfq.id, 'Koldental', offer({ 'rękawice m': { price: 20 }, 'igły': { price: 3 } }));
    saveOffer(rfq.id, 'Meditrans', offer({ 'rękawice m': { price: 18 }, 'igły': { price: 5 } }));
    expect(selectionForSupplier(getRfq(rfq.id), 'Koldental')).toEqual({ 'rękawice m': 'Koldental', 'igły': 'Koldental' });
    const selection = { 'rękawice m': 'Meditrans', 'igły': 'Koldental' };
    updateRfq(rfq.id, { selection });
    expect(selectionTotal(getRfq(rfq.id), selection)).toBe(195);
    const orders = placeOrdersFromRfq(rfq.id);
    expect(orders.map((o) => o.supplier).sort()).toEqual(['Koldental', 'Meditrans']);
    expect(getOrders()).toHaveLength(2);
    expect(getRfq(rfq.id).status).toBe('ordered');
  });

  test('e-mail negocjacyjny wymienia tylko pozycje, gdzie dostawca przegrywa', () => {
    const rfq = createRfq({ items: ITEMS, suppliers: SUPPLIERS.slice(0, 2), deadline: '2026-11-10' });
    saveOffer(rfq.id, 'Koldental', offer({ 'rękawice m': { price: 20 }, 'igły': { price: 3 } }));
    saveOffer(rfq.id, 'Meditrans', offer({ 'rękawice m': { price: 18 }, 'igły': { price: 5 } }));
    const mail = buildNegotiationEmail({ rfq: getRfq(rfq.id), supplierName: 'Koldental' });
    expect(mail).toContain('Rękawice M');
    expect(mail).not.toContain('Igły');
  });
});

describe('historia cen', () => {
  test('oferty i zamówienia zapisują ceny', () => {
    const rfq = createRfq({ items: [ITEMS[0]], suppliers: SUPPLIERS.slice(0, 1), deadline: '2026-11-10' });
    saveOffer(rfq.id, 'Koldental', offer({ 'rękawice m': { price: 20 } }));
    updateRfq(rfq.id, { selection: { 'rękawice m': 'Koldental' } });
    placeOrdersFromRfq(rfq.id);
    const history = priceHistoryFor('Rękawice M');
    expect(history.map((h) => h.source)).toEqual(['oferta', 'zamówienie']);
    expect(getPriceHistory()).toHaveLength(2);
  });
});

describe('magazyn i listy', () => {
  const stock = [
    { id: 1, name: 'A', quantity: 0, minStock: 5 },
    { id: 2, name: 'B', quantity: 3, minStock: 5 },
    { id: 3, name: 'C', quantity: 8, minStock: 5, alertLevel: 10 },
    { id: 4, name: 'D', quantity: 20, minStock: 5 },
  ];

  test('poziomy: brak / poniżej minimum / kończy się / w normie', () => {
    expect(stock.map(stockLevel)).toEqual(['out', 'low', 'alert', 'ok']);
  });

  test('lista z braków uzupełnia do progu ostrzegawczego', () => {
    expect(buildListFromStock(stock).map((i) => [i.name, i.quantity])).toEqual([['A', 10], ['B', 7], ['C', 2]]);
    expect(buildListFromStock(stock, { onlyBelowMinimum: true }).map((i) => i.name)).toEqual(['A', 'B']);
  });

  test('zamknięcie listy nadaje kolejny numer i czyści bieżącą', () => {
    localStorage.setItem(KEYS.shoppingList, JSON.stringify([{ name: 'A', quantity: 1 }]));
    const first = closeShoppingList({ items: [{ name: 'A', quantity: 1 }] });
    const second = closeShoppingList({ items: [{ name: 'B', quantity: 2 }] });
    expect([first.number, second.number]).toEqual([1, 2]);
    expect(readJSON(KEYS.shoppingList, null)).toEqual([]);
    expect(getClosedLists()).toHaveLength(2);
    expect(listTitle(first)).toMatch(/^Lista zakupów nr 1 z \d+ \S+ \d{4}/);
  });

  test('kody: domyślny kod i wyszukiwanie bez względu na wielkość liter', () => {
    expect(getItemCode({ id: 42 })).toBe('MD000042');
    expect(findStockByCode(stock, 'md000003').name).toBe('C');
    expect(findStockByCode([{ id: 9, code: 'ABC-1', name: 'X' }], ' abc-1 ').name).toBe('X');
  });
});

describe('powiadomienia', () => {
  test('stany magazynu i spóźnione oferty', () => {
    const rfq = createRfq({ items: ITEMS, suppliers: SUPPLIERS.slice(0, 2), deadline: '2026-11-01' });
    const list = buildNotifications({
      stock: [
        { id: 1, name: 'A', quantity: 0, minStock: 5 },
        { id: 2, name: 'C', quantity: 8, minStock: 5 },
        { id: 3, name: 'D', quantity: 50, minStock: 5 },
      ],
      orders: [],
      rfqs: [getRfq(rfq.id)],
      now: new Date('2026-11-04T10:00:00'),
    });
    expect(list.map((n) => n.id)).toEqual(['stock-out-1', expect.stringMatching(/^rfq-overdue-/), 'stock-alert-2']);
  });
});

describe('eksport do Power BI', () => {
  test('CSV z separatorem ; i przecinkiem dziesiętnym', () => {
    const csv = toCsv([{ a: 'x;y', b: 12.5 }], [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]);
    expect(csv).toBe('﻿A;B\n"x;y";12,5');
  });

  test('jeden wiersz na pozycję zamówienia', () => {
    localStorage.setItem(KEYS.orderHistory, JSON.stringify([
      { id: 'o1', isoDate: '2026-10-01T10:00:00.000Z', supplier: 'K', items: [{ name: 'A', quantity: 2, price: 5 }, { name: 'B', quantity: 1, price: 0 }] },
    ]));
    expect(orderLinesForReport()).toEqual([
      expect.objectContaining({ product: 'A', value: 10, date: '2026-10-01' }),
      expect.objectContaining({ product: 'B', value: 0 }),
    ]);
  });
});
