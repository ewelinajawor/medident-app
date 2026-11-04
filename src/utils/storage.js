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
