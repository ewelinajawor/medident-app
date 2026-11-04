// Wspólna warstwa danych aplikacji (localStorage).
// Klucze są zgodne z wcześniejszymi wersjami, więc istniejące dane użytkownika zostają zachowane.

export const KEYS = {
  shoppingList: "products",
  orderHistory: "orderHistory",
  orderNotes: "notes",
  inventory: "inventoryStock",
  inventoryUpdatedAt: "lastInventoryUpdate",
  customProducts: "customProducts",
  suppliers: "suppliers",
  calendarEvents: "calendarEvents",
  profile: "userProfile",
  closedLists: "closedShoppingLists",
  rfqs: "rfqs",
  priceHistory: "priceHistory",
  notificationsRead: "notificationsRead",
};

export const ORDER_STATUSES = ["W realizacji", "Wysłane", "Dostarczone"];

export const DEFAULT_SUPPLIERS = [
  {
    id: 1,
    name: "Koldental",
    email: "info@koldental.com.pl",
    phone: "+48 22 514 62 00",
    nip: "524-100-15-93",
    address: "ul. Marszałkowska 15, 00-626 Warszawa",
    contactPerson: "Anna Kowalska",
  },
  {
    id: 2,
    name: "Meditrans",
    email: "e-sklep@meditrans.pl",
    phone: "+48 41 306 71 22",
    nip: "657-289-60-29",
    address: "ul. Przemysłowa 8, 41-200 Sosnowiec",
    contactPerson: "Marek Nowak",
  },
  {
    id: 3,
    name: "Marrodent",
    email: "marek.fajkis@marrodent.pl",
    phone: "+48 33 815 20 13",
    nip: "937-234-38-99",
    address: "ul. Dentystyczna 12, 42-600 Tarnowskie Góry",
    contactPerson: "Marek Fajkis",
  },
];

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Nie udało się odczytać "${key}" z localStorage:`, error);
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Nie udało się zapisać "${key}" w localStorage:`, error);
  }
}

// ---------- Lista zakupów ----------

/** Zwraca nową listę z dodanym produktem (lub zwiększoną ilością, jeśli już jest na liście). */
export function mergeIntoList(list, item) {
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const index = list.findIndex((p) => p.name === item.name);
  if (index !== -1) {
    return list.map((p, i) => (i === index ? { ...p, quantity: p.quantity + quantity } : p));
  }
  return [
    ...list,
    {
      name: item.name,
      category: item.category || "Inne",
      quantity,
      price: item.price || 0,
      dateAdded: new Date().toLocaleDateString("pl-PL"),
    },
  ];
}

/** Dodaje produkt do listy zakupów zapisanej w localStorage (używane poza ekranem Listy Zakupów). */
export function addToShoppingList(item) {
  const list = readJSON(KEYS.shoppingList, []);
  writeJSON(KEYS.shoppingList, mergeIntoList(list, item));
}

// ---------- Dostawcy ----------

export function getSuppliers() {
  const stored = readJSON(KEYS.suppliers, null);
  return Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_SUPPLIERS;
}

// ---------- Zamówienia ----------

/** Starsze zamówienia mają datę "dd.mm.rrrr" (opcjonalnie z godziną) – `new Date()` odczytałby ją jako mm.dd. */
export function toIsoDate(value) {
  if (!value) return new Date().toISOString();
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?/.exec(String(value));
  if (match) {
    const [, d, m, y, hh = "0", mm = "0"] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)).toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/**
 * Sprowadza zamówienia zapisane przez różne ekrany (Lista Zakupów, Oferty) do jednego formatu:
 * { id, date (ISO), supplier, status, items: [{ name, quantity, price }], amount, notes }
 */
export function normalizeOrder(order, index = 0) {
  const items = (order.items || order.products || []).map((p) => {
    const product = p.product || p; // Oferty zapisują { product, quantity }
    return {
      name: product.name,
      quantity: p.quantity || 1,
      price: product.bestPrice || product.price || 0,
      category: product.category,
      gratis: p.gratis || undefined,
    };
  });
  const amount =
    typeof order.amount === "number"
      ? order.amount
      : typeof order.totalCost === "number"
      ? order.totalCost
      : items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return {
    ...order,
    id: order.id || `legacy_${index}`,
    date: toIsoDate(order.isoDate || order.fullDate || order.date),
    supplier: order.supplier || order.providers || order.supplierName || "—",
    status: order.status || "W realizacji",
    items,
    amount,
    notes: order.notes || order.note || "",
  };
}

export function getOrders() {
  return readJSON(KEYS.orderHistory, []).map(normalizeOrder);
}

export function saveOrders(orders) {
  writeJSON(KEYS.orderHistory, orders);
}

export function appendOrder({ supplier, items, notes = "", deliveryDate }) {
  const now = new Date();
  const order = normalizeOrder({
    id: `ord_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
    isoDate: now.toISOString(),
    supplier,
    status: "W realizacji",
    items,
    notes,
    deliveryDate,
  });
  saveOrders([...getOrders(), order]);
  recordPrices(order.items.map((i) => ({ name: i.name, supplier, price: i.price, source: "zamówienie" })));
  return order;
}

/** Przyjmuje pozycje zamówienia na magazyn (dopasowanie po nazwie produktu). */
export function receiveOrderIntoInventory(order) {
  const stock = readJSON(KEYS.inventory, []);
  const nowIso = new Date().toISOString();
  let updated = [...stock];
  order.items.forEach((item) => {
    const idx = updated.findIndex((s) => s.name === item.name);
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity, lastReceived: nowIso };
    } else {
      updated.push({
        id: `stock_${Date.now()}_${updated.length}`,
        catalogId: null,
        name: item.name,
        category: item.category || "Inne",
        description: "",
        unit: "szt",
        minStock: 5,
        quantity: item.quantity,
        lastReceived: nowIso,
        notes: [{ date: nowIso, text: `Dostawa z zamówienia (${order.supplier})`, type: "receive" }],
      });
    }
  });
  writeJSON(KEYS.inventory, updated);
  writeJSON(KEYS.inventoryUpdatedAt, new Date().toLocaleString("pl-PL"));
}

// ---------- Tekst zamówienia (e-mail) ----------

export function buildOrderEmail({ clinicName, items, notes }) {
  const lines = items.map((i, n) => `${n + 1}. ${i.name} — ${i.quantity} szt.`);
  return [
    "Dzień dobry,",
    "",
    `uprzejmie prosimy o realizację zamówienia${clinicName ? ` dla ${clinicName}` : ""}:`,
    "",
    ...lines,
    "",
    notes ? `Uwagi: ${notes}` : null,
    notes ? "" : null,
    "Pozdrawiamy",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// ---------- Stany magazynowe: minimum i próg ostrzegawczy ----------
// Klient: „poniżej 10, a zanim spadnie do 5 – powiadomienie”.
// minStock = minimum (5), alertLevel = próg ostrzegawczy (10). Domyślnie próg = 2 × minimum.

export const getAlertLevel = (item) =>
  Number.isFinite(item.alertLevel) && item.alertLevel > 0 ? item.alertLevel : (item.minStock || 0) * 2;

/** 'out' – brak, 'low' – poniżej minimum, 'alert' – poniżej progu ostrzegawczego, 'ok' */
export function stockLevel(item) {
  if (item.quantity <= 0) return "out";
  if (item.quantity < (item.minStock || 0)) return "low";
  if (item.quantity < getAlertLevel(item)) return "alert";
  return "ok";
}

export const STOCK_LEVEL_LABELS = { out: "Brak", low: "Poniżej minimum", alert: "Kończy się", ok: "W normie" };

// ---------- Kody produktów (kod kreskowy / QR / RFID) ----------
// Czytniki kodów kreskowych, QR i większość czytników RFID na USB działają jak klawiatura:
// „wpisują” kod i Enter. Dlatego wystarczy jeden kod tekstowy na pozycję magazynową.

export function defaultCodeFor(item) {
  const digits = String(item.id).replace(/\D/g, "").slice(-6).padStart(6, "0");
  return `MD${digits}`;
}

export const getItemCode = (item) => item.code || defaultCodeFor(item);

export function findStockByCode(stock, code) {
  const wanted = String(code || "").trim().toUpperCase();
  if (!wanted) return null;
  return stock.find((item) => getItemCode(item).toUpperCase() === wanted) || null;
}

// ---------- Listy zakupów: zamykanie i numeracja ----------

/** Pozycje do listy z braków: wszystko poniżej progu ostrzegawczego, uzupełnione do tego progu. */
export function buildListFromStock(stock, { onlyBelowMinimum = false } = {}) {
  return stock
    .filter((item) => {
      const level = stockLevel(item);
      return onlyBelowMinimum ? level === "out" || level === "low" : level !== "ok";
    })
    .map((item) => ({
      name: item.name,
      category: item.category || "Inne",
      quantity: Math.max(1, getAlertLevel(item) - item.quantity),
      price: 0,
      dateAdded: new Date().toLocaleDateString("pl-PL"),
      fromStock: true,
    }));
}

export const getClosedLists = () => readJSON(KEYS.closedLists, []);

export function listTitle(list) {
  const date = new Date(list.closedAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  return `Lista zakupów nr ${list.number} z ${date}`;
}

/** Zamyka bieżącą listę: zapisuje ją w archiwum z kolejnym numerem i czyści bieżącą. */
export function closeShoppingList({ items, notes = "" }) {
  const closed = getClosedLists();
  const list = {
    id: `list_${Date.now()}`,
    number: closed.reduce((max, l) => Math.max(max, l.number || 0), 0) + 1,
    closedAt: new Date().toISOString(),
    items: items.map((i) => ({ name: i.name, category: i.category || "Inne", quantity: i.quantity, price: i.price || 0 })),
    notes,
    rfqId: null,
  };
  writeJSON(KEYS.closedLists, [...closed, list]);
  writeJSON(KEYS.shoppingList, []);
  localStorage.setItem(KEYS.orderNotes, "");
  return list;
}

export function updateClosedList(id, changes) {
  writeJSON(
    KEYS.closedLists,
    getClosedLists().map((l) => (l.id === id ? { ...l, ...changes } : l))
  );
}

// ---------- Historia cen ----------

export const getPriceHistory = () => readJSON(KEYS.priceHistory, []);

/** entries: [{ name, supplier, price, date?, source: 'oferta' | 'zamówienie' }] */
export function recordPrices(entries) {
  const valid = entries.filter((e) => e.name && e.price > 0);
  if (valid.length === 0) return;
  const now = new Date().toISOString();
  writeJSON(KEYS.priceHistory, [
    ...getPriceHistory(),
    ...valid.map((e) => ({ name: e.name, supplier: e.supplier || "—", price: e.price, date: e.date || now, source: e.source || "oferta" })),
  ]);
}

/** Historia ceny jednego produktu, od najstarszej. */
export function priceHistoryFor(name, history = getPriceHistory()) {
  return history
    .filter((e) => e.name === name)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ---------- Eksport do Power BI ----------

const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV z separatorem ";" i przecinkiem dziesiętnym – tak otwiera go polski Excel i Power BI. */
export function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.label)).join(";");
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const value = typeof c.value === "function" ? c.value(row) : row[c.value];
        return csvCell(typeof value === "number" ? String(value).replace(".", ",") : value);
      })
      .join(";")
  );
  return "﻿" + [header, ...body].join("\n");
}

/** Płaska tabela pozycji zamówień (jeden wiersz = jedna pozycja) – źródło dla raportu Power BI. */
export function orderLinesForReport(orders = getOrders()) {
  return orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId: order.id,
      date: order.date.slice(0, 10),
      supplier: order.supplier,
      status: order.status,
      product: item.name,
      category: item.category || "Inne",
      quantity: item.quantity,
      unitPrice: item.price || 0,
      value: Math.round((item.price || 0) * item.quantity * 100) / 100,
    }))
  );
}
