import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, X, Send, Download, History, PackageOpen, Archive } from "lucide-react";
import "./ShoppingList.css";
import { formatMoney } from "../utils/format";
import {
  KEYS,
  readJSON,
  writeJSON,
  getSuppliers,
  getOrders,
  appendOrder,
  buildOrderEmail,
  buildListFromStock,
  closeShoppingList,
  getClosedLists,
  listTitle,
  getPriceHistory,
} from "../utils/storage";
import { createRfq, buildRfqEmail, getRfqs, RFQ_STATUSES } from "../utils/rfq";

const formatPrice = (value) => (value > 0 ? formatMoney(value) : "—");

// Starsze zamówienia mają datę w formacie "dd.mm.rrrr", nowe – ISO.
const formatOrderDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" });
};

const formatShortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pl-PL");
};

// dateAdded zapisujemy jako "dd.mm.rrrr" – zamiana na Date do porównań.
const parsePlDate = (value) => {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(String(value || ""));
  return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null;
};

const toDateInput = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return toDateInput(d);
};

const RFQ_BADGE = { open: "badge-info", analysis: "badge-warning", ordered: "badge-success", cancelled: "" };

const STATUS_BADGE = {
  "W realizacji": "badge-info",
  "Wysłane": "badge-warning",
  "Dostarczone": "badge-success",
};

// Nazwa arkusza w Excelu: maks. 31 znaków, bez []:*?/\
const sheetName = (name, used) => {
  const base = (name.replace(/[[\]:*?/\\]/g, " ").trim() || "Arkusz").slice(0, 31);
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

const templates = [
  {
    id: "basic",
    name: "Materiały podstawowe",
    description: "Codzienne potrzeby gabinetu",
    products: [
      { name: "Amalgam dentystyczny", quantity: 10 },
      { name: "Rękawice nitrylowe M", quantity: 5 },
      { name: "Maseczki chirurgiczne", quantity: 3 },
      { name: "Wadki dentystyczne", quantity: 10 },
    ],
  },
  {
    id: "endodontics",
    name: "Endodoncja – komplet",
    description: "Zestaw do leczenia kanałowego",
    products: [
      { name: "Wkłady endodontyczne", quantity: 2 },
      { name: "Cement glasjonomerowy", quantity: 3 },
      { name: "Środek dezynfekcyjny", quantity: 2 },
    ],
  },
  {
    id: "surgery",
    name: "Chirurgia – zestaw",
    description: "Materiały do zabiegów chirurgicznych",
    products: [
      { name: "Nici chirurgiczne", quantity: 5 },
      { name: "Skalpele jednorazowe", quantity: 2 },
      { name: "Igły do znieczulenia", quantity: 3 },
    ],
  },
  {
    id: "protection",
    name: "Środki ochrony",
    description: "Kompletna ochrona personelu",
    products: [
      { name: "Rękawice nitrylowe M", quantity: 10 },
      { name: "Rękawice nitrylowe L", quantity: 5 },
      { name: "Maseczki chirurgiczne", quantity: 8 },
      { name: "Środek dezynfekcyjny", quantity: 3 },
    ],
  },
];

const ShoppingList = ({ clinicName }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(() => readJSON(KEYS.shoppingList, []));
  const [orderHistory, setOrderHistory] = useState(() => getOrders());
  const [notes, setNotes] = useState(() => localStorage.getItem(KEYS.orderNotes) || "");
  const [closedLists, setClosedLists] = useState(() => getClosedLists());
  const [rfqs] = useState(() => getRfqs());
  const [priceHistory] = useState(() => getPriceHistory());
  const [suppliers] = useState(() => getSuppliers());
  const [productOptions, setProductOptions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sheet, setSheet] = useState("all"); // zakładka kategorii na liście
  const [activeTab, setActiveTab] = useState("build"); // "build", "templates", "archive"
  const [quickAddAmount, setQuickAddAmount] = useState(1);
  const [message, setMessage] = useState(null); // { text, undo? }
  const [expandedHistory, setExpandedHistory] = useState(null);

  // Lista z braków magazynowych
  const [stockPanel, setStockPanel] = useState(false);
  const [onlyBelowMinimum, setOnlyBelowMinimum] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  // Zamykanie listy / wysyłka
  const [dialog, setDialog] = useState(null); // { mode: 'rfq' | 'direct', items, listId }
  const [rfqSuppliers, setRfqSuppliers] = useState([]);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [directSupplier, setDirectSupplier] = useState("");
  const [confirmCloseOnly, setConfirmCloseOnly] = useState(false);

  useEffect(() => {
    writeJSON(KEYS.shoppingList, products);
  }, [products]);

  useEffect(() => {
    localStorage.setItem(KEYS.orderNotes, notes);
  }, [notes]);

  useEffect(() => {
    const loadProducts = async () => {
      const fetchedProducts = await fetchProductsFromAPI();
      const sortedProducts = fetchedProducts.sort((a, b) => a.name.localeCompare(b.name, "pl"));
      setProductOptions(sortedProducts);
      setCategories(
        [...new Set(fetchedProducts.map((product) => product.category))]
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, "pl"))
      );
    };
    loadProducts();
  }, []);

  const showMessage = (text, undo = null) => {
    setMessage({ text, undo });
    setTimeout(() => setMessage((m) => (m && m.text === text ? null : m)), undo ? 8000 : 4000);
  };

  const fetchProductsFromAPI = async () => {
    try {
      const response = await fetch(`${process.env.PUBLIC_URL}/dental_products.json`);
      if (!response.ok) throw new Error("Nie udało się załadować danych.");
      const data = await response.json();
      return data.map((product) => ({ ...product, category: product.category || "Inne" }));
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
      return [];
    }
  };

  const catalogNames = useMemo(() => new Set(productOptions.map((p) => p.name)), [productOptions]);

  const filteredProducts = useMemo(() => {
    let filtered = productOptions;
    const query = searchQuery.trim().toLowerCase();
    if (query.length >= 2) {
      filtered = filtered.filter(
        (product) => product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query)
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }
    return filtered.slice(0, 8);
  }, [productOptions, searchQuery, selectedCategory]);

  // Produkty często kupowane razem (na podstawie historii zamówień)
  const smartSuggestions = useMemo(() => {
    if (orderHistory.length === 0) return [];
    const currentProductNames = products.map((p) => p.name);
    const suggestions = [];
    orderHistory.forEach((order) => {
      const orderProductNames = order.items.map((p) => p.name);
      if (!currentProductNames.some((name) => orderProductNames.includes(name))) return;
      orderProductNames.forEach((productName) => {
        if (currentProductNames.includes(productName)) return;
        const existing = suggestions.find((s) => s.name === productName);
        if (existing) {
          existing.frequency += 1;
        } else {
          const productData = productOptions.find((p) => p.name === productName);
          if (productData) suggestions.push({ ...productData, frequency: 1 });
        }
      });
    });
    return suggestions.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }, [orderHistory, products, productOptions]);

  const historyByName = useMemo(() => {
    const map = {};
    priceHistory.forEach((entry) => {
      (map[entry.name] = map[entry.name] || []).push(entry);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => new Date(b.date) - new Date(a.date)));
    return map;
  }, [priceHistory]);

  const categoryOf = (product) =>
    product.category || productOptions.find((p) => p.name === product.name)?.category || "Inne";

  // Zakładki kategorii – jak arkusze w Excelu
  const sheets = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const c = categoryOf(p);
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0], "pl"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, productOptions]);

  useEffect(() => {
    if (sheet !== "all" && !sheets.some(([name]) => name === sheet)) setSheet("all");
  }, [sheet, sheets]);

  const visibleRows = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => sheet === "all" || categoryOf(product) === sheet);

  const listStarted = useMemo(() => {
    const dates = products.map((p) => parsePlDate(p.dateAdded)).filter(Boolean);
    return dates.length ? new Date(Math.min(...dates)) : null;
  }, [products]);

  const nextListNumber = closedLists.reduce((max, l) => Math.max(max, l.number || 0), 0) + 1;

  // ---------- Operacje na liście ----------

  const createListItem = (productData, quantity) => ({
    name: productData.name,
    quantity,
    dateAdded: new Date().toLocaleDateString("pl-PL"),
    price: productData.price || 0,
    category: productData.category || "Inne",
  });

  const mergeItems = (list, newItems) =>
    newItems.reduce((acc, item) => {
      const index = acc.findIndex((p) => p.name === item.name);
      if (index === -1) return [...acc, item];
      return acc.map((p, i) => (i === index ? { ...p, quantity: p.quantity + item.quantity } : p));
    }, list);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.trim().length >= 2);
  };

  const handleAddProduct = (productData, quantity = quickAddAmount) => {
    setProducts((prev) => mergeItems(prev, [createListItem(productData, quantity)]));
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleAddCustom = () => {
    const name = searchQuery.trim();
    if (!name) return;
    handleAddProduct({ name, category: selectedCategory !== "all" ? selectedCategory : "Inne" });
    showMessage(`Dodano „${name}” spoza bazy produktów.`);
  };

  const updateItem = (index, changes) => {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...changes } : p)));
  };

  const handleQuantityChange = (index, value) => {
    const quantity = Math.floor(Number(value));
    if (quantity >= 1) updateItem(index, { quantity });
  };

  const handleRemoveProduct = (index) => {
    const removed = products[index];
    setProducts((prev) => prev.filter((_, i) => i !== index));
    showMessage(`Usunięto „${removed.name}”.`, () => {
      setProducts((prev) => [...prev.slice(0, index), removed, ...prev.slice(index)]);
      setMessage(null);
    });
  };

  const handleApplyTemplate = (template) => {
    const findProduct = (name) => {
      const lower = name.toLowerCase();
      return (
        productOptions.find((p) => p.name.toLowerCase() === lower) ||
        productOptions.find((p) => p.name.toLowerCase().includes(lower))
      );
    };
    const missing = [];
    const templateProducts = template.products.map((templateProduct) => {
      const productData = findProduct(templateProduct.name);
      if (!productData) {
        missing.push(templateProduct.name);
        return createListItem({ name: templateProduct.name, category: "Inne" }, templateProduct.quantity);
      }
      return createListItem(productData, templateProduct.quantity);
    });
    setProducts((prev) => mergeItems(prev, templateProducts));
    setActiveTab("build");
    showMessage(
      missing.length > 0 ? `Dodano szablon. Spoza bazy produktów: ${missing.join(", ")}.` : "Dodano produkty z szablonu."
    );
  };

  // ---------- Lista z braków ----------

  const stockItems = useMemo(
    () => (stockPanel ? buildListFromStock(readJSON(KEYS.inventory, []), { onlyBelowMinimum }) : []),
    [stockPanel, onlyBelowMinimum]
  );

  const applyStockList = (replace) => {
    if (stockItems.length === 0) return;
    if (replace) {
      setProducts(stockItems);
    } else {
      // Pozycja już na liście: bierzemy większą z ilości, żeby ponowne kliknięcie nie dublowało zamówienia.
      setProducts((prev) =>
        stockItems.reduce((acc, item) => {
          const index = acc.findIndex((p) => p.name === item.name);
          if (index === -1) return [...acc, item];
          return acc.map((p, i) => (i === index ? { ...p, quantity: Math.max(p.quantity, item.quantity) } : p));
        }, prev)
      );
    }
    setStockPanel(false);
    setConfirmReplace(false);
    showMessage(`Dodano ${stockItems.length} poz. z braków magazynowych.`);
  };

  // ---------- Eksport do Excela ----------

  const handleExportExcel = async () => {
    if (products.length === 0) return;
    try {
      const { default: writeExcelFile } = await import("write-excel-file/browser");
      const header = ["Produkt", "Kategoria", "Ilość", "Cena jedn. brutto", "Wartość", "Dodano"].map((value) => ({
        value,
        fontWeight: "bold",
      }));
      const toRows = (items) => [
        header,
        ...items.map((p) => {
          const price = p.bestPrice || p.price || 0;
          return [
            { value: p.name },
            { value: categoryOf(p) },
            { value: p.quantity, type: Number },
            price > 0 ? { value: price, type: Number, format: "#,##0.00" } : { value: "" },
            price > 0 ? { value: Math.round(price * p.quantity * 100) / 100, type: Number, format: "#,##0.00" } : { value: "" },
            { value: p.dateAdded || "" },
          ];
        }),
      ];
      const columns = [{ width: 48 }, { width: 24 }, { width: 8 }, { width: 16 }, { width: 14 }, { width: 12 }];
      const used = new Set();
      const allSheet = { data: toRows(products), sheet: sheetName("Wszystkie", used), columns, stickyRowsCount: 1 };
      const categorySheets = sheets.map(([category]) => ({
        data: toRows(products.filter((p) => categoryOf(p) === category)),
        sheet: sheetName(category, used),
        columns,
        stickyRowsCount: 1,
      }));
      await writeExcelFile([allSheet, ...categorySheets]).toFile(`lista_zakupow_${toDateInput(new Date())}.xlsx`);
    } catch (error) {
      console.error("Eksport do Excela nie powiódł się:", error);
      showMessage("Nie udało się utworzyć pliku Excel.");
    }
  };

  // ---------- Zamykanie listy i wysyłka ----------

  const openDialog = (mode, source = { items: products, listId: null }) => {
    setDialog({ mode, ...source });
    setRfqSuppliers(suppliers.map((s) => s.name));
    setDeadline(defaultDeadline());
    setDirectSupplier(suppliers[0]?.name || "");
  };

  const refreshAfterClose = () => {
    setProducts([]);
    setNotes("");
    setClosedLists(getClosedLists());
  };

  const handleSendRfq = () => {
    const chosen = suppliers.filter((s) => rfqSuppliers.includes(s.name));
    if (chosen.length === 0 || !deadline) return;
    // Nowe zapytanie z bieżącej listy zamyka ją; z archiwum – korzysta z już zamkniętej.
    const listId = dialog.listId || closeShoppingList({ items: dialog.items, notes }).id;
    const rfq = createRfq({ items: dialog.items, suppliers: chosen, deadline, listId });
    if (!dialog.listId) refreshAfterClose();

    const emails = chosen.map((s) => s.email).filter(Boolean);
    if (emails.length > 0) {
      const subject = encodeURIComponent(`Zapytanie ofertowe nr ${rfq.number}${clinicName ? ` – ${clinicName}` : ""}`);
      const body = encodeURIComponent(buildRfqEmail({ clinicName, rfq }));
      window.location.href = `mailto:?bcc=${emails.join(",")}&subject=${subject}&body=${body}`;
    }
    setDialog(null);
    navigate(`/offers?rfq=${rfq.id}`);
  };

  const handleDirectOrder = () => {
    const supplier = suppliers.find((s) => s.name === directSupplier);
    if (!supplier) return;
    appendOrder({ supplier: supplier.name, items: dialog.items, notes });
    if (!dialog.listId) {
      closeShoppingList({ items: dialog.items, notes });
      refreshAfterClose();
    }
    setOrderHistory(getOrders());
    if (supplier.email) {
      const subject = encodeURIComponent(`Zamówienie${clinicName ? ` – ${clinicName}` : ""}`);
      const body = encodeURIComponent(buildOrderEmail({ clinicName, items: dialog.items, notes }));
      window.location.href = `mailto:${supplier.email}?subject=${subject}&body=${body}`;
    }
    setDialog(null);
    showMessage(`Zamówienie u ${supplier.name} zapisane w historii.`);
  };

  const handleCloseOnly = () => {
    const list = closeShoppingList({ items: products, notes });
    refreshAfterClose();
    setConfirmCloseOnly(false);
    showMessage(`Zamknięto: ${listTitle(list)}.`);
  };

  const handleReloadList = (list) => {
    setProducts((prev) =>
      mergeItems(
        prev,
        list.items.map((i) => ({ ...createListItem(i, i.quantity), price: i.price || 0 }))
      )
    );
    setActiveTab("build");
    showMessage(`Wczytano pozycje z: ${listTitle(list)}.`);
  };

  const totalCost = products.reduce((total, p) => total + p.quantity * (p.bestPrice || p.price || 0), 0);
  const rfqById = Object.fromEntries(rfqs.map((r) => [r.id, r]));
  const query = searchQuery.trim();
  const exactMatch = productOptions.some((p) => p.name.toLowerCase() === query.toLowerCase());

  return (
    <div className="shopping-list page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Lista zakupów</h1>
          <p className="page-subtitle">
            Zbierz produkty, zamknij listę i wyślij zapytanie ofertowe do dostawców.
          </p>
        </div>
        {products.length > 0 && (
          <button onClick={handleExportExcel} className="btn btn-secondary">
            <Download /> Eksportuj do Excela
          </button>
        )}
      </header>

      {message && (
        <div className="notice" role="status">
          <span>{message.text}</span>
          {message.undo && (
            <button type="button" className="btn btn-ghost btn-sm sl-undo" onClick={message.undo}>
              Cofnij
            </button>
          )}
        </div>
      )}

      <div className="tabs" role="tablist">
        {[
          { id: "build", label: "Bieżąca lista", count: products.length },
          { id: "templates", label: "Szablony" },
          { id: "archive", label: "Zamknięte listy", count: closedLists.length },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="tab-count num">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Bieżąca lista */}
      {activeTab === "build" && (
        <div className="sl-layout">
          <div className="sl-main">
            <section className="card sl-add">
              <div className="sl-add-head">
                <h3>Dodaj produkt</h3>
                <div className="sl-quick-amount">
                  <span className="muted">Ilość przy dodawaniu</span>
                  <div className="stepper">
                    <button type="button" onClick={() => setQuickAddAmount(Math.max(1, quickAddAmount - 1))} aria-label="Zmniejsz ilość">
                      −
                    </button>
                    <span className="num">{quickAddAmount}</span>
                    <button type="button" onClick={() => setQuickAddAmount(quickAddAmount + 1)} aria-label="Zwiększ ilość">
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="sl-search">
                <div className="sl-search-field">
                  <Search className="sl-search-icon" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Wpisz nazwę produktu (min. 2 znaki)"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(query.length >= 2)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && query.length >= 2) {
                        e.preventDefault();
                        if (filteredProducts.length > 0) handleAddProduct(filteredProducts[0]);
                        else handleAddCustom();
                      }
                    }}
                  />
                </div>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} aria-label="Kategoria">
                  <option value="all">Wszystkie kategorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {showSuggestions && query.length >= 2 && (
                  <ul className="sl-suggestions">
                    {filteredProducts.map((product, index) => (
                      <li key={index}>
                        <button type="button" onClick={() => handleAddProduct(product)}>
                          <span className="sl-suggestion-main">
                            <span className="sl-suggestion-name">{product.name}</span>
                            <span className="sl-suggestion-meta">{product.category}</span>
                          </span>
                          <span className="num muted">{formatPrice(product.price ?? 0)}</span>
                          <span className="sl-suggestion-add">Dodaj {quickAddAmount}</span>
                        </button>
                      </li>
                    ))}
                    {!exactMatch && (
                      <li className="sl-suggestion-custom">
                        <button type="button" onClick={handleAddCustom}>
                          <span className="sl-suggestion-main">
                            <span className="sl-suggestion-name">Dodaj „{query}” spoza bazy</span>
                            <span className="sl-suggestion-meta">
                              {filteredProducts.length === 0 ? "Nie znaleziono w bazie produktów" : "Produkt, którego nie ma w bazie"}
                            </span>
                          </span>
                          <span />
                          <span className="sl-suggestion-add">Dodaj {quickAddAmount}</span>
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="sl-from-stock">
                {!stockPanel ? (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStockPanel(true)}>
                    <PackageOpen /> Utwórz listę z braków
                  </button>
                ) : (
                  <div className="sl-stock-panel">
                    <div className="sl-stock-options" role="radiogroup" aria-label="Które produkty">
                      <label className="sl-check">
                        <input type="radio" checked={!onlyBelowMinimum} onChange={() => setOnlyBelowMinimum(false)} />
                        Kończące się i poniżej minimum
                      </label>
                      <label className="sl-check">
                        <input type="radio" checked={onlyBelowMinimum} onChange={() => setOnlyBelowMinimum(true)} />
                        Tylko poniżej minimum
                      </label>
                    </div>
                    <p className="muted sl-stock-summary">
                      {stockItems.length > 0
                        ? `${stockItems.length} poz. z magazynu, ilości uzupełniają stan do progu ostrzegawczego.`
                        : "W magazynie nie ma produktów spełniających ten warunek."}
                    </p>
                    {confirmReplace ? (
                      <div className="sl-inline-confirm">
                        <span>Zastąpić bieżącą listę ({products.length} poz.)?</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => applyStockList(true)}>
                          Zastąp
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReplace(false)}>
                          Anuluj
                        </button>
                      </div>
                    ) : (
                      <div className="sl-stock-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={stockItems.length === 0}
                          onClick={() => applyStockList(false)}
                        >
                          Dodaj do listy
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={stockItems.length === 0}
                          onClick={() => (products.length > 0 ? setConfirmReplace(true) : applyStockList(true))}
                        >
                          Zastąp listę
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStockPanel(false)}>
                          Anuluj
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {smartSuggestions.length > 0 && (
                <div className="sl-related">
                  <span className="section-label">Często kupowane razem</span>
                  <div className="sl-related-list">
                    {smartSuggestions.map((suggestion, index) => (
                      <button key={index} type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddProduct(suggestion)}>
                        <Plus /> {suggestion.name}
                        <span className="muted num">{suggestion.frequency}×</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="card card-flush">
              <div className="sl-list-head">
                <div>
                  <h3>
                    Lista nr {nextListNumber} <span className="muted num">({products.length} poz.)</span>
                  </h3>
                  <p className="sl-list-meta muted">
                    {listStarted ? `Rozpoczęta ${listStarted.toLocaleDateString("pl-PL")}` : "Nowa lista"}
                  </p>
                </div>
              </div>

              {products.length > 0 && sheets.length > 1 && (
                <div className="sl-sheets" role="tablist" aria-label="Kategorie">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={sheet === "all"}
                    className={`sl-sheet ${sheet === "all" ? "active" : ""}`}
                    onClick={() => setSheet("all")}
                  >
                    Wszystkie <span className="num muted">{products.length}</span>
                  </button>
                  {sheets.map(([name, count]) => (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={sheet === name}
                      className={`sl-sheet ${sheet === name ? "active" : ""}`}
                      onClick={() => setSheet(name)}
                    >
                      {name} <span className="num muted">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {products.length > 0 ? (
                <div className="table-wrap">
                  <table className="sl-table">
                    <thead>
                      <tr>
                        <th>Produkt</th>
                        <th>Dodano</th>
                        <th className="right">Cena</th>
                        <th>Ilość</th>
                        <th className="right">Wartość</th>
                        <th aria-label="Akcje"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map(({ product, index }) => {
                        const unitPrice = product.bestPrice || product.price || 0;
                        const history = historyByName[product.name] || [];
                        const isCustom = productOptions.length > 0 && !catalogNames.has(product.name);
                        const expanded = expandedHistory === index;
                        return (
                          <React.Fragment key={`${product.name}-${index}`}>
                            <tr>
                              <td className="sl-product-cell">
                                {isCustom ? (
                                  <input
                                    type="text"
                                    className="sl-name-input"
                                    value={product.name}
                                    onChange={(e) => updateItem(index, { name: e.target.value })}
                                    aria-label="Nazwa produktu"
                                  />
                                ) : (
                                  <span className="sl-product-name">{product.name}</span>
                                )}
                                <span className="sl-product-meta">
                                  {categoryOf(product)}
                                  {isCustom && " · spoza bazy"}
                                  {product.fromStock && " · z braków"}
                                </span>
                              </td>
                              <td className="num muted sl-nowrap">{product.dateAdded || "—"}</td>
                              <td className="right num muted">
                                {formatPrice(unitPrice)}
                                {history.length > 0 && (
                                  <button
                                    type="button"
                                    className="sl-history-toggle"
                                    onClick={() => setExpandedHistory(expanded ? null : index)}
                                    aria-expanded={expanded}
                                    title="Historia cen"
                                  >
                                    <History /> {history.length}
                                  </button>
                                )}
                              </td>
                              <td>
                                <div className="sl-qty">
                                  <div className="stepper">
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(index, product.quantity - 1)}
                                      aria-label="Zmniejsz ilość"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      className="num"
                                      value={product.quantity}
                                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                                      aria-label={`Ilość: ${product.name}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(index, product.quantity + 1)}
                                      aria-label="Zwiększ ilość"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleQuantityChange(index, product.quantity + 5)}
                                    title="Dodaj 5"
                                  >
                                    +5
                                  </button>
                                </div>
                              </td>
                              <td className="right num">{formatPrice(unitPrice * product.quantity)}</td>
                              <td className="right">
                                <button
                                  type="button"
                                  className="sl-remove"
                                  onClick={() => handleRemoveProduct(index)}
                                  aria-label={`Usuń ${product.name}`}
                                  title="Usuń z listy"
                                >
                                  <X />
                                </button>
                              </td>
                            </tr>
                            {expanded && (
                              <tr className="sl-history-row">
                                <td colSpan={6}>
                                  <span className="section-label">Historia cen: {product.name}</span>
                                  <table className="sl-mini-table">
                                    <thead>
                                      <tr>
                                        <th>Data</th>
                                        <th>Dostawca</th>
                                        <th>Źródło</th>
                                        <th className="right">Cena brutto</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {history.slice(0, 8).map((entry, i) => (
                                        <tr key={i}>
                                          <td className="num">{formatShortDate(entry.date)}</td>
                                          <td>{entry.supplier}</td>
                                          <td className="muted">{entry.source}</td>
                                          <td className="right num">{formatMoney(entry.price)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="sl-empty">
                  <p>Lista jest pusta.</p>
                  <p className="muted">
                    Wyszukaj produkt powyżej, utwórz listę z braków magazynowych albo skorzystaj z szablonu.
                  </p>
                </div>
              )}
            </section>
          </div>

          {products.length > 0 && (
            <aside className="card sl-summary">
              <h3>Zamknięcie listy</h3>
              <dl className="sl-totals">
                <dt>Pozycji</dt>
                <dd className="num">{products.length}</dd>
                <dt>Wartość (znane ceny)</dt>
                <dd className="num sl-total-value">{formatMoney(totalCost)}</dd>
              </dl>

              <label className="sl-field">
                <span className="sl-field-label">Uwagi</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Np. termin dostawy, numer gabinetu" />
              </label>

              <button onClick={() => openDialog("rfq")} className="btn btn-primary sl-send">
                <Send /> Zamknij listę i wyślij zapytanie
              </button>
              <p className="sl-hint muted">
                Dostawcy dostaną prośbę o ofertę. Odpowiedzi wpiszesz w „Zapytaniach ofertowych”, gdzie aplikacja wskaże najtańszy wariant.
              </p>

              <div className="sl-secondary-actions">
                <button type="button" className="btn btn-secondary" onClick={() => openDialog("direct")}>
                  Zamów bez zapytania
                </button>
                {confirmCloseOnly ? (
                  <div className="sl-inline-confirm">
                    <span>Zamknąć listę bez wysyłania?</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleCloseOnly}>Zamknij</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmCloseOnly(false)}>Anuluj</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirmCloseOnly(true)}>
                    <Archive /> Zamknij listę bez wysyłania
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Szablony */}
      {activeTab === "templates" && (
        <div className="sl-templates">
          {templates.map((template) => (
            <section key={template.id} className="card sl-template">
              <h3>{template.name}</h3>
              <p className="muted">{template.description}</p>
              <ul className="sl-template-items">
                {template.products.map((product, index) => (
                  <li key={index}>
                    <span>{product.name}</span>
                    <span className="num muted">{product.quantity}</span>
                  </li>
                ))}
              </ul>
              <button className="btn btn-secondary" onClick={() => handleApplyTemplate(template)}>
                <Plus /> Dodaj do listy
              </button>
            </section>
          ))}
        </div>
      )}

      {/* Zamknięte listy */}
      {activeTab === "archive" && (
        <section className="card card-flush">
          <div className="sl-list-head">
            <h3>Zamknięte listy</h3>
          </div>
          {closedLists.length > 0 ? (
            <div className="table-wrap">
              <table className="sl-table">
                <thead>
                  <tr>
                    <th>Lista</th>
                    <th className="right">Pozycji</th>
                    <th>Zapytanie ofertowe</th>
                    <th aria-label="Akcje"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...closedLists].sort((a, b) => b.number - a.number).map((list) => {
                    const rfq = list.rfqId ? rfqById[list.rfqId] : null;
                    return (
                      <tr key={list.id}>
                        <td>
                          <span className="sl-product-name">{listTitle(list)}</span>
                          <span className="sl-product-meta">
                            {list.items.slice(0, 3).map((i) => i.name).join(", ")}
                            {list.items.length > 3 && ` i ${list.items.length - 3} więcej`}
                          </span>
                        </td>
                        <td className="right num">{list.items.length}</td>
                        <td>
                          {rfq ? (
                            <Link to={`/offers?rfq=${rfq.id}`} className="sl-rfq-link">
                              Nr {rfq.number}{" "}
                              <span className={`badge ${RFQ_BADGE[rfq.status] || ""}`}>{RFQ_STATUSES[rfq.status]}</span>
                            </Link>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="right sl-nowrap">
                          {!rfq && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => openDialog("rfq", { items: list.items, listId: list.id })}
                            >
                              Wyślij zapytanie
                            </button>
                          )}
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleReloadList(list)}>
                            Wczytaj ponownie
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sl-info">
              Nie ma jeszcze zamkniętych list. Zamknięta lista dostaje numer i datę, np. „Lista zakupów nr 1 z 4 listopada 2026”.
            </p>
          )}
        </section>
      )}

      {/* Historia zamówień */}
      <section className="card card-flush sl-history">
        <div className="sl-list-head">
          <h3>Ostatnie zamówienia</h3>
          <Link to="/orders" className="btn btn-ghost btn-sm">Wszystkie zamówienia</Link>
        </div>
        {orderHistory.length > 0 ? (
          <div className="table-wrap">
            <table className="sl-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Dostawca</th>
                  <th>Status</th>
                  <th>Produkty</th>
                  <th className="right">Wartość</th>
                  <th aria-label="Akcje"></th>
                </tr>
              </thead>
              <tbody>
                {[...orderHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="num sl-nowrap">{formatOrderDate(order.date)}</td>
                    <td>{order.supplier}</td>
                    <td><span className={`badge ${STATUS_BADGE[order.status] || ""}`}>{order.status}</span></td>
                    <td className="sl-history-items">
                      {order.items.slice(0, 3).map((product) => `${product.name} (${product.quantity})`).join(", ")}
                      {order.items.length > 3 && <span className="muted"> i {order.items.length - 3} więcej</span>}
                    </td>
                    <td className="right num">{formatPrice(order.amount)}</td>
                    <td className="right sl-nowrap">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(order)}>Podgląd</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setProducts((prev) => mergeItems(prev, order.items.map((i) => createListItem(i, i.quantity))));
                          setActiveTab("build");
                          showMessage("Skopiowano pozycje zamówienia na bieżącą listę.");
                        }}
                      >
                        Kopiuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sl-info">Brak historii zamówień.</p>
        )}
      </section>

      {/* Szczegóły zamówienia */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="sl-modal" role="dialog" aria-modal="true" aria-labelledby="sl-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="sl-modal-head">
              <h3 id="sl-modal-title">Szczegóły zamówienia</h3>
              <button type="button" className="sl-remove" onClick={() => setSelectedOrder(null)} aria-label="Zamknij">
                <X />
              </button>
            </div>
            <dl className="sl-totals">
              <dt>Data</dt>
              <dd className="num">{formatOrderDate(selectedOrder.date)}</dd>
              <dt>Status</dt>
              <dd><span className={`badge ${STATUS_BADGE[selectedOrder.status] || ""}`}>{selectedOrder.status}</span></dd>
              <dt>Dostawca</dt>
              <dd>{selectedOrder.supplier}</dd>
              <dt>Wartość</dt>
              <dd className="num">{formatPrice(selectedOrder.amount)}</dd>
              <dt>Uwagi</dt>
              <dd>{selectedOrder.notes || <span className="muted">Brak uwag</span>}</dd>
            </dl>
            <h4 className="section-label">Produkty</h4>
            <ul className="sl-template-items">
              {selectedOrder.items.map((product, index) => (
                <li key={index}>
                  <span>{product.name}</span>
                  <span className="num muted">
                    {product.quantity} szt.
                    {product.price > 0 && ` · ${formatMoney(product.quantity * product.price)}`}
                  </span>
                </li>
              ))}
            </ul>
            <div className="sl-modal-actions">
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">Zamknij</button>
            </div>
          </div>
        </div>
      )}

      {/* Zapytanie ofertowe / zamówienie bez zapytania */}
      {dialog && (
        <div className="modal-backdrop" onClick={() => setDialog(null)}>
          <div className="sl-modal" role="dialog" aria-modal="true" aria-labelledby="sl-dialog-title" onClick={(e) => e.stopPropagation()}>
            <div className="sl-modal-head">
              <h3 id="sl-dialog-title">{dialog.mode === "rfq" ? "Wyślij zapytanie ofertowe" : "Zamów bez zapytania"}</h3>
              <button type="button" className="sl-remove" onClick={() => setDialog(null)} aria-label="Zamknij">
                <X />
              </button>
            </div>

            <p className="muted sl-dialog-intro">
              {dialog.items.length} poz.
              {!dialog.listId && ` · lista zostanie zamknięta jako nr ${nextListNumber}`}
            </p>

            {dialog.mode === "rfq" ? (
              <>
                <fieldset className="sl-field sl-suppliers">
                  <legend className="sl-field-label">Do których dostawców</legend>
                  {suppliers.map((supplier) => (
                    <label key={supplier.name} className="sl-check">
                      <input
                        type="checkbox"
                        checked={rfqSuppliers.includes(supplier.name)}
                        onChange={(e) =>
                          setRfqSuppliers((prev) =>
                            e.target.checked ? [...prev, supplier.name] : prev.filter((n) => n !== supplier.name)
                          )
                        }
                      />
                      <span>{supplier.name}</span>
                      <span className="sl-supplier-email muted">{supplier.email || "brak e-maila"}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="sl-field sl-deadline">
                  <span className="sl-field-label">Termin na oferty</span>
                  <input type="date" value={deadline} min={toDateInput(new Date())} onChange={(e) => setDeadline(e.target.value)} />
                </label>
                <p className="sl-hint muted">
                  Otworzy się program pocztowy z gotową treścią zapytania (adresaci w UDW).
                </p>
                <div className="sl-modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>Anuluj</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={rfqSuppliers.length === 0 || !deadline}
                    onClick={handleSendRfq}
                  >
                    <Send /> Wyślij zapytanie ({rfqSuppliers.length})
                  </button>
                </div>
              </>
            ) : (
              <>
                <fieldset className="sl-field sl-suppliers">
                  <legend className="sl-field-label">Dostawca</legend>
                  {suppliers.map((supplier) => (
                    <label key={supplier.name} className="sl-check">
                      <input
                        type="radio"
                        name="sl-direct-supplier"
                        checked={directSupplier === supplier.name}
                        onChange={() => setDirectSupplier(supplier.name)}
                      />
                      <span>{supplier.name}</span>
                      <span className="sl-supplier-email muted">{supplier.email || "brak e-maila"}</span>
                    </label>
                  ))}
                </fieldset>
                <p className="sl-hint muted">
                  Zamówienie trafi do historii, a program pocztowy otworzy gotową wiadomość do dostawcy.
                </p>
                <div className="sl-modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>Anuluj</button>
                  <button type="button" className="btn btn-primary" disabled={!directSupplier} onClick={handleDirectOrder}>
                    <Send /> Zamów u {directSupplier || "dostawcy"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
