// Zapytania ofertowe (RFQ): lista → zapytanie do kilku dostawców → oferty → analiza → zamówienia.
import { KEYS, readJSON, writeJSON, appendOrder, recordPrices, updateClosedList } from "./storage";
import { formatMoney } from "./format";

export const RFQ_STATUSES = {
  open: "Czeka na oferty",
  analysis: "Do analizy",
  ordered: "Zamówione",
  cancelled: "Anulowane",
};

export const SUPPLIER_STATUSES = {
  pending: "Czeka na ofertę",
  received: "Oferta otrzymana",
  declined: "Odmówił",
};

const itemKey = (name) => name.trim().toLowerCase();

export const getRfqs = () => readJSON(KEYS.rfqs, []);
const saveRfqs = (rfqs) => writeJSON(KEYS.rfqs, rfqs);

export function getRfq(id) {
  return getRfqs().find((r) => r.id === id) || null;
}

export function updateRfq(id, updater) {
  let updated = null;
  saveRfqs(
    getRfqs().map((r) => {
      if (r.id !== id) return r;
      updated = typeof updater === "function" ? updater(r) : { ...r, ...updater };
      return updated;
    })
  );
  return updated;
}

export function deleteRfq(id) {
  saveRfqs(getRfqs().filter((r) => r.id !== id));
}

/**
 * items: [{ name, category, quantity }]
 * suppliers: [{ name, email }]
 * deadline: "rrrr-mm-dd" – do kiedy dostawcy mają odesłać oferty
 */
export function createRfq({ items, suppliers, deadline, listId = null, title = "" }) {
  const rfqs = getRfqs();
  const rfq = {
    id: `rfq_${Date.now()}`,
    number: rfqs.reduce((max, r) => Math.max(max, r.number || 0), 0) + 1,
    title,
    listId,
    createdAt: new Date().toISOString(),
    deadline,
    status: "open",
    includeGratis: true,
    items: items.map((i) => ({ key: itemKey(i.name), name: i.name, category: i.category || "Inne", quantity: i.quantity })),
    suppliers: suppliers.map((s) => ({
      name: s.name,
      email: s.email || "",
      status: "pending",
      receivedAt: null,
      lastContactAt: null,
      offer: null,
    })),
    selection: {},
    orderIds: [],
  };
  saveRfqs([...rfqs, rfq]);
  if (listId) updateClosedList(listId, { rfqId: rfq.id });
  return rfq;
}

/** Koniec dnia terminu – oferta wysłana tego dnia jeszcze się mieści. */
const deadlineEnd = (deadline) => {
  const d = new Date(`${deadline}T23:59:59`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function isOverdue(rfq, now = new Date()) {
  const end = deadlineEnd(rfq.deadline);
  return Boolean(end) && now > end;
}

/** „Otrzymano 2 z 3 ofert” + kto się spóźnia. */
export function rfqProgress(rfq, now = new Date()) {
  const total = rfq.suppliers.length;
  const received = rfq.suppliers.filter((s) => s.status === "received").length;
  const declined = rfq.suppliers.filter((s) => s.status === "declined").length;
  const pending = rfq.suppliers.filter((s) => s.status === "pending");
  const overdue = isOverdue(rfq, now) ? pending.map((s) => s.name) : [];
  const end = deadlineEnd(rfq.deadline);
  const daysLeft = end ? Math.ceil((end - now) / 86400000) || 0 : null; // || 0 zamienia -0 na 0
  return { total, received, declined, pending: pending.length, overdue, daysLeft, complete: pending.length === 0 };
}

/**
 * Oferta dostawcy: lines[itemKey] = { price (brutto/szt.), available, gratisQty, gratisDesc, gratisValue }
 * Gratis musi mieć podaną wartość w zł – tylko wtedy da się go uczciwie porównać.
 */
export function validateOffer(rfq, offer) {
  const errors = {};
  rfq.items.forEach((item) => {
    const line = offer.lines?.[item.key];
    if (!line || line.available === false) return;
    if (!(Number(line.price) > 0)) errors[item.key] = "Podaj cenę brutto albo zaznacz „brak”.";
    else if ((Number(line.gratisQty) > 0 || (line.gratisDesc || "").trim()) && !(Number(line.gratisValue) > 0)) {
      errors[item.key] = "Gratis wymaga podania jego wartości w zł.";
    }
  });
  return errors;
}

export function saveOffer(rfqId, supplierName, offer) {
  const rfq = updateRfq(rfqId, (r) => {
    const suppliers = r.suppliers.map((s) =>
      s.name === supplierName ? { ...s, status: "received", receivedAt: new Date().toISOString(), offer } : s
    );
    const allIn = suppliers.every((s) => s.status !== "pending");
    return { ...r, suppliers, status: r.status === "open" && allIn ? "analysis" : r.status };
  });
  recordPrices(
    rfq.items
      .map((item) => {
        const line = offer.lines?.[item.key];
        return line && line.available !== false ? { name: item.name, supplier: supplierName, price: Number(line.price), source: "oferta" } : null;
      })
      .filter(Boolean)
  );
  return rfq;
}

export function setSupplierStatus(rfqId, supplierName, changes) {
  return updateRfq(rfqId, (r) => ({
    ...r,
    suppliers: r.suppliers.map((s) => (s.name === supplierName ? { ...s, ...changes } : s)),
  }));
}

/** Koszt pozycji u dostawcy: cena × ilość, minus wartość gratisu (jeśli gratisy uwzględniamy). */
export function lineCost(line, quantity, includeGratis = true) {
  if (!line || line.available === false || !(Number(line.price) > 0)) return null;
  const base = Number(line.price) * quantity;
  const gratis = includeGratis ? Number(line.gratisValue) || 0 : 0;
  return Math.max(0, Math.round((base - gratis) * 100) / 100);
}

/**
 * Analiza ofert:
 *  - perSupplier: suma u każdego dostawcy i ile pozycji nie oferuje,
 *  - cheapestSupplier: najtańszy dostawca spośród tych, którzy mają WSZYSTKIE pozycje,
 *  - optimal: najtańszy dostawca osobno dla każdej pozycji (zamówienie dzielone),
 *  - savings: ile oszczędza podział względem najtańszego pojedynczego dostawcy.
 */
export function analyzeRfq(rfq, includeGratis = rfq.includeGratis !== false) {
  const offered = rfq.suppliers.filter((s) => s.status === "received" && s.offer);

  const perSupplier = offered.map((s) => {
    let total = 0;
    let missing = 0;
    rfq.items.forEach((item) => {
      const cost = lineCost(s.offer.lines?.[item.key], item.quantity, includeGratis);
      if (cost === null) missing += 1;
      else total += cost;
    });
    return { name: s.name, total: Math.round(total * 100) / 100, missing, complete: missing === 0, deliveryDays: s.offer.deliveryDays };
  });

  const complete = perSupplier.filter((s) => s.complete).sort((a, b) => a.total - b.total);
  const cheapestSupplier = complete[0] || null;

  const perItem = rfq.items.map((item) => {
    const options = offered
      .map((s) => ({ supplier: s.name, cost: lineCost(s.offer.lines?.[item.key], item.quantity, includeGratis), line: s.offer.lines?.[item.key] }))
      .filter((o) => o.cost !== null)
      .sort((a, b) => a.cost - b.cost);
    return { key: item.key, name: item.name, quantity: item.quantity, options, best: options[0] || null };
  });

  const uncovered = perItem.filter((i) => !i.best).map((i) => i.name);
  const optimalTotal = Math.round(perItem.reduce((sum, i) => sum + (i.best ? i.best.cost : 0), 0) * 100) / 100;
  const optimalSelection = Object.fromEntries(perItem.filter((i) => i.best).map((i) => [i.key, i.best.supplier]));
  const optimalSuppliers = [...new Set(Object.values(optimalSelection))];

  return {
    perSupplier,
    cheapestSupplier,
    perItem,
    uncovered,
    optimal: { total: optimalTotal, selection: optimalSelection, suppliers: optimalSuppliers },
    savings: cheapestSupplier ? Math.round((cheapestSupplier.total - optimalTotal) * 100) / 100 : null,
  };
}

/** Zaznacza („ptaszkiem”) jednego dostawcę dla wszystkich pozycji, które oferuje. */
export function selectionForSupplier(rfq, supplierName) {
  const supplier = rfq.suppliers.find((s) => s.name === supplierName);
  if (!supplier?.offer) return {};
  return Object.fromEntries(
    rfq.items
      .filter((item) => lineCost(supplier.offer.lines?.[item.key], item.quantity) !== null)
      .map((item) => [item.key, supplierName])
  );
}

export function selectionTotal(rfq, selection, includeGratis = rfq.includeGratis !== false) {
  return Math.round(
    rfq.items.reduce((sum, item) => {
      const supplier = rfq.suppliers.find((s) => s.name === selection[item.key]);
      const cost = supplier?.offer ? lineCost(supplier.offer.lines?.[item.key], item.quantity, includeGratis) : null;
      return sum + (cost || 0);
    }, 0) * 100
  ) / 100;
}

/** Tworzy po jednym zamówieniu na każdego zaznaczonego dostawcę i zamyka zapytanie. */
export function placeOrdersFromRfq(rfqId, notes = "") {
  const rfq = getRfq(rfqId);
  const bySupplier = {};
  rfq.items.forEach((item) => {
    const supplierName = rfq.selection[item.key];
    if (!supplierName) return;
    const supplier = rfq.suppliers.find((s) => s.name === supplierName);
    const line = supplier?.offer?.lines?.[item.key];
    if (!line) return;
    (bySupplier[supplierName] = bySupplier[supplierName] || []).push({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: Number(line.price),
      gratis: Number(line.gratisQty) > 0 || line.gratisDesc ? { qty: Number(line.gratisQty) || 0, desc: line.gratisDesc || "", value: Number(line.gratisValue) || 0 } : null,
    });
  });
  const orders = Object.entries(bySupplier).map(([supplier, items]) =>
    appendOrder({ supplier, items, notes: notes || `Z zapytania ofertowego nr ${rfq.number}` })
  );
  updateRfq(rfqId, { status: "ordered", orderIds: orders.map((o) => o.id), orderedAt: new Date().toISOString() });
  return orders;
}

// ---------- Treści e-maili ----------

export function buildRfqEmail({ clinicName, rfq }) {
  const deadline = new Date(`${rfq.deadline}T12:00:00`).toLocaleDateString("pl-PL");
  return [
    "Dzień dobry,",
    "",
    `prosimy o przesłanie oferty cenowej (ceny brutto) na poniższe produkty${clinicName ? ` dla ${clinicName}` : ""}:`,
    "",
    ...rfq.items.map((i, n) => `${n + 1}. ${i.name} — ${i.quantity} szt.`),
    "",
    "Prosimy o informację o ewentualnych gratisach i ich wartości oraz o czasie dostawy.",
    `Na ofertę czekamy do ${deadline}.`,
    "",
    "Pozdrawiamy",
  ].join("\n");
}

export function buildReminderEmail({ clinicName, rfq }) {
  const deadline = new Date(`${rfq.deadline}T12:00:00`).toLocaleDateString("pl-PL");
  return [
    "Dzień dobry,",
    "",
    `uprzejmie przypominamy o zapytaniu ofertowym nr ${rfq.number}${clinicName ? ` od ${clinicName}` : ""} (termin: ${deadline}).`,
    "Czy możemy liczyć na ofertę?",
    "",
    "Pozdrawiamy",
  ].join("\n");
}

/** E-mail negocjacyjny: pozycje, w których dostawca nie jest najtańszy, z najlepszą ceną konkurencji. */
export function buildNegotiationEmail({ clinicName, rfq, supplierName }) {
  const analysis = analyzeRfq(rfq);
  const supplier = rfq.suppliers.find((s) => s.name === supplierName);
  const lines = analysis.perItem
    .map((item) => {
      const own = item.options.find((o) => o.supplier === supplierName);
      const bestOther = item.options.find((o) => o.supplier !== supplierName);
      if (!own || !bestOther || own.cost <= bestOther.cost) return null;
      const unit = Number(supplier.offer.lines[item.key].price);
      const target = Math.round((bestOther.cost / item.quantity) * 100) / 100;
      return `• ${item.name} (${item.quantity} szt.): Państwa cena ${formatMoney(unit)}/szt., otrzymaliśmy ofertę ${formatMoney(target)}/szt.`;
    })
    .filter(Boolean);
  if (lines.length === 0) return null;
  return [
    "Dzień dobry,",
    "",
    `dziękujemy za ofertę do zapytania nr ${rfq.number}${clinicName ? ` (${clinicName})` : ""}.`,
    "Chętnie złożymy zamówienie u Państwa, ale w kilku pozycjach otrzymaliśmy korzystniejsze ceny:",
    "",
    ...lines,
    "",
    "Czy są Państwo w stanie zaproponować lepsze warunki?",
    "",
    "Pozdrawiamy",
  ].join("\n");
}
