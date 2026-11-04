// Powiadomienia generowane z danych aplikacji (zamiast przykładowych).
import { KEYS, readJSON, writeJSON, getOrders, stockLevel, getAlertLevel } from "./storage";
import { getRfqs, rfqProgress } from "./rfq";

/**
 * Każde powiadomienie ma stabilne id – zależne od stanu, którego dotyczy – więc „przeczytane”
 * nie wraca po odświeżeniu, a nowy problem (np. spadek z progu do zera) pojawia się jako nowe.
 * Pola: { id, type, title, message, date, priority: 'high'|'medium'|'low', category, link, item? }
 */
export function buildNotifications({
  stock = readJSON(KEYS.inventory, []),
  orders = getOrders(),
  rfqs = getRfqs(),
  now = new Date(),
} = {}) {
  const list = [];
  const nowIso = now.toISOString();

  stock.forEach((item) => {
    const level = stockLevel(item);
    if (level === "ok") return;
    const unit = item.unit || "szt";
    const common = { date: item.lastIssued || item.lastReceived || nowIso, category: "Magazyn", link: "/inventory", item };
    if (level === "out") {
      list.push({ ...common, id: `stock-out-${item.id}`, type: "critical-stock", priority: "high", title: "Brak na stanie", message: `${item.name} – stan 0 ${unit}.` });
    } else if (level === "low") {
      list.push({ ...common, id: `stock-low-${item.id}`, type: "critical-stock", priority: "high", title: "Poniżej minimum", message: `${item.name} – zostało ${item.quantity} ${unit} (minimum ${item.minStock}).` });
    } else {
      list.push({ ...common, id: `stock-alert-${item.id}`, type: "low-stock", priority: "medium", title: "Kończy się", message: `${item.name} – zostało ${item.quantity} ${unit}, próg ostrzegawczy ${getAlertLevel(item)}.` });
    }
  });

  rfqs
    .filter((r) => r.status === "open" || r.status === "analysis")
    .forEach((rfq) => {
      const progress = rfqProgress(rfq, now);
      const link = `/offers?rfq=${rfq.id}`;
      if (progress.overdue.length > 0) {
        list.push({
          id: `rfq-overdue-${rfq.id}-${progress.overdue.join(",")}`,
          type: "rfq-overdue",
          priority: "high",
          title: `Zapytanie nr ${rfq.number}: minął termin ofert`,
          message: `Brak oferty od: ${progress.overdue.join(", ")}. Warto zadzwonić albo wysłać przypomnienie.`,
          date: nowIso,
          category: "Oferty",
          link,
        });
      } else if (progress.received > 0) {
        list.push({
          id: `rfq-progress-${rfq.id}-${progress.received}`,
          type: "rfq-progress",
          priority: progress.complete ? "medium" : "low",
          title: `Zapytanie nr ${rfq.number}: otrzymano ${progress.received} z ${progress.total} ofert`,
          message: progress.complete ? "Wszystkie oferty są – można zrobić analizę." : `Czekamy jeszcze na ${progress.pending}.`,
          date: rfq.suppliers.map((s) => s.receivedAt).filter(Boolean).sort().pop() || rfq.createdAt,
          category: "Oferty",
          link,
        });
      }
    });

  orders
    .filter((o) => o.status === "Wysłane")
    .forEach((order) => {
      list.push({
        id: `order-shipped-${order.id}`,
        type: "order-pending",
        priority: "low",
        title: "Zamówienie w drodze",
        message: `${order.supplier} – ${order.items.length} poz. Po dostawie przyjmij je na magazyn.`,
        date: order.date,
        category: "Zamówienia",
        link: "/orders",
      });
    });

  const rank = { high: 0, medium: 1, low: 2 };
  return list.sort((a, b) => rank[a.priority] - rank[b.priority] || new Date(b.date) - new Date(a.date));
}

export const getReadNotificationIds = () => readJSON(KEYS.notificationsRead, []);

export function markNotificationsRead(ids) {
  writeJSON(KEYS.notificationsRead, [...new Set([...getReadNotificationIds(), ...ids])]);
}
