import React, { useState, useEffect, useMemo } from "react";
import { saveAs } from "file-saver";
import { Search, Plus, X, Send, Download } from "lucide-react";
import "./ShoppingList.css";
import { formatMoney } from '../utils/format';
import {
  KEYS,
  readJSON,
  writeJSON,
  getSuppliers,
  getOrders,
  appendOrder,
  buildOrderEmail,
} from "../utils/storage";

const formatPrice = (value) => (value > 0 ? `${formatMoney(value)}` : "—");

// Starsze zamówienia mają datę w formacie "dd.mm.rrrr", nowe – ISO.
const formatOrderDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" });
};

const ShoppingList = ({ clinicName }) => {
  const [products, setProducts] = useState(() => readJSON(KEYS.shoppingList, []));
  const [orderHistory, setOrderHistory] = useState(() => getOrders());
  const [notes, setNotes] = useState(() => localStorage.getItem(KEYS.orderNotes) || "");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState([]);
  // Dostawcy pochodzą z ekranu "Dostawcy", więc nowo dodani pojawiają się także tutaj.
  const [suppliers] = useState(() =>
    getSuppliers().map((s) => ({
      value: s.name,
      label: s.name,
      email: s.email,
    }))
  );
  const [productOptions, setProductOptions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [activeTab, setActiveTab] = useState("build"); // "build", "compare", "templates"
  const [quickAddAmount, setQuickAddAmount] = useState(1);
  const [message, setMessage] = useState("");

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

      const uniqueCategories = [...new Set(fetchedProducts.map((product) => product.category))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pl"));
      setCategories(uniqueCategories);
    };

    loadProducts();
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const fetchProductsFromAPI = async () => {
    try {
      const response = await fetch(`${process.env.PUBLIC_URL}/dental_products.json`);
      if (!response.ok) {
        throw new Error("Nie udało się załadować danych.");
      }
      const data = await response.json();
      // Ceny u dostawców pokazujemy tylko wtedy, gdy są w danych (supplierPrices).
      // Wcześniej były one wyliczane z mnożników (x1.15, x1.08), czyli zmyślone.
      return data.map(product => ({
        ...product,
        category: product.category || "Inne",
        supplierPrices: product.supplierPrices || null,
      }));
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
      return [
        {
          "name": "GĄSIENICA wewnętrzne",
          "category": "Paski formówki",
          "price": 18.0,
          "supplierPrices": {
            "Koldental": 18.0,
            "Meditrans": 21.25,
            "Marrodent": 19.5
          }
        },
        {
          "name": "Amalgam dentystyczny",
          "category": "Materiały wypełniające", 
          "price": 29.5,
          "supplierPrices": {
            "Koldental": 29.5,
            "Meditrans": 32.0,
            "Marrodent": 30.75
          }
        },
        {
          "name": "Rękawice nitrylowe M",
          "category": "Środki ochrony",
          "price": 24.5,
          "supplierPrices": {
            "Koldental": 26.0,
            "Meditrans": 24.5,
            "Marrodent": 25.25
          }
        },
        {
          "name": "Maseczki chirurgiczne",
          "category": "Środki ochrony",
          "price": 15.0,
          "supplierPrices": {
            "Koldental": 15.0,
            "Meditrans": 16.5,
            "Marrodent": 15.75
          }
        }
      ];
    }
  };

  // Enhanced search and filtering
  const filteredProducts = useMemo(() => {
    let filtered = productOptions;
    
    if (searchQuery.length >= 2) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    return filtered.slice(0, 8); // Limit suggestions
  }, [productOptions, searchQuery, selectedCategory]);

  // Smart suggestions based on history
  const smartSuggestions = useMemo(() => {
    if (orderHistory.length === 0) return [];
    
    // Find products often bought together
    const currentProductNames = products.map(p => p.name);
    const suggestions = [];

    orderHistory.forEach(order => {
      const orderProductNames = order.items.map(p => p.name);
      const hasCurrentProducts = currentProductNames.some(name => 
        orderProductNames.includes(name)
      );
      
      if (hasCurrentProducts) {
        orderProductNames.forEach(productName => {
          if (!currentProductNames.includes(productName)) {
            const existing = suggestions.find(s => s.name === productName);
            if (existing) {
              existing.frequency += 1;
            } else {
              const productData = productOptions.find(p => p.name === productName);
              if (productData) {
                suggestions.push({
                  ...productData,
                  frequency: 1
                });
              }
            }
          }
        });
      }
    });
    
    return suggestions
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }, [orderHistory, products, productOptions]);

  // Predefined templates
  const templates = [
    {
      id: "basic",
      name: "Materiały podstawowe",
      description: "Codzienne potrzeby gabinetu",
      products: [
        { name: "Amalgam dentystyczny", quantity: 10 },
        { name: "Rękawice nitrylowe M", quantity: 5 },
        { name: "Maseczki chirurgiczne", quantity: 3 },
        { name: "Wadki dentystyczne", quantity: 10 }
      ]
    },
    {
      id: "endodontics",
      name: "Endodoncja – komplet",
      description: "Zestaw do leczenia kanałowego",
      products: [
        { name: "Wkłady endodontyczne", quantity: 2 },
        { name: "Cement glasjonomerowy", quantity: 3 },
        { name: "Środek dezynfekcyjny", quantity: 2 }
      ]
    },
    {
      id: "surgery",
      name: "Chirurgia – zestaw",
      description: "Materiały do zabiegów chirurgicznych",
      products: [
        { name: "Nici chirurgiczne", quantity: 5 },
        { name: "Skalpele jednorazowe", quantity: 2 },
        { name: "Igły do znieczulenia", quantity: 3 }
      ]
    },
    {
      id: "protection",
      name: "Środki ochrony",
      description: "Kompletna ochrona personelu",
      products: [
        { name: "Rękawice nitrylowe M", quantity: 10 },
        { name: "Rękawice nitrylowe L", quantity: 5 },
        { name: "Maseczki chirurgiczne", quantity: 8 },
        { name: "Środek dezynfekcyjny", quantity: 3 }
      ]
    }
  ];

  // Grouped products for display
  const groupedProducts = useMemo(() => {
    if (!groupByCategory) return { "Wszystkie produkty": products };
    
    const grouped = {};
    products.forEach(product => {
      const productData = productOptions.find(p => p.name === product.name);
      const category = productData?.category || product.category || "Inne";
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    
    return grouped;
  }, [products, productOptions, groupByCategory]);

  // Get best supplier for each product
  const getBestSupplier = (productName) => {
    const product = productOptions.find(p => p.name === productName);
    if (!product?.supplierPrices) return null;
    
    let bestSupplier = null;
    let bestPrice = Infinity;
    
    Object.entries(product.supplierPrices).forEach(([supplier, price]) => {
      if (price < bestPrice) {
        bestPrice = price;
        bestSupplier = supplier;
      }
    });
    
    return { supplier: bestSupplier, price: bestPrice };
  };

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.length >= 2);
  };

  const createListItem = (productData, quantity) => {
    const bestOffer = getBestSupplier(productData.name);
    return {
      name: productData.name,
      quantity,
      dateAdded: new Date().toLocaleDateString("pl-PL"),
      price: productData.price || 0,
      bestSupplier: bestOffer?.supplier,
      bestPrice: bestOffer?.price,
      category: productData.category,
    };
  };

  // Scala nowe pozycje z listą bez mutowania istniejących obiektów.
  const mergeItems = (list, newItems) =>
    newItems.reduce((acc, item) => {
      const index = acc.findIndex(p => p.name === item.name);
      if (index === -1) return [...acc, item];
      return acc.map((p, i) => (i === index ? { ...p, quantity: p.quantity + item.quantity } : p));
    }, list);

  const handleAddProduct = (productData, quantity = quickAddAmount) => {
    setProducts(prev => mergeItems(prev, [createListItem(productData, quantity)]));
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity >= 1) {
      setProducts(prev =>
        prev.map((product, i) =>
          i === index ? { ...product, quantity: newQuantity } : product
        )
      );
    }
  };

  const handleRemoveProduct = (index) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten produkt?")) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleApplyTemplate = (template) => {
    // Szablony używają nazw ogólnych, więc szukamy najpierw dokładnej nazwy, potem nazwy zawierającej frazę.
    const findProduct = (name) => {
      const lower = name.toLowerCase();
      return (
        productOptions.find(p => p.name.toLowerCase() === lower) ||
        productOptions.find(p => p.name.toLowerCase().includes(lower))
      );
    };

    const missing = [];
    const templateProducts = template.products
      .map(templateProduct => {
        const productData = findProduct(templateProduct.name);
        if (!productData) {
          missing.push(templateProduct.name);
          // Produkt spoza bazy i tak trafia na listę – lepiej niż ciche pominięcie.
          return createListItem({ name: templateProduct.name, category: "Inne" }, templateProduct.quantity);
        }
        return createListItem(productData, templateProduct.quantity);
      });

    setProducts(prev => mergeItems(prev, templateProducts));
    setActiveTab("build");
    showMessage(
      missing.length > 0
        ? `Dodano szablon. Spoza bazy produktów: ${missing.join(", ")}.`
        : "Dodano produkty z szablonu."
    );
  };

  const handleSendOrder = () => {
    if (selectedProviders.length === 0) {
      showMessage("Wybierz co najmniej jednego dostawcę.");
      return;
    }

    if (products.length === 0) {
      showMessage("Dodaj produkty do zamówienia.");
      return;
    }

    // Jedno zamówienie na dostawcę – dzięki temu każde ma własny status na ekranie "Zamówienia".
    selectedProviders.forEach(provider => {
      appendOrder({ supplier: provider.label, items: products, notes });
    });
    setOrderHistory(getOrders());

    // Aplikacja nie ma własnej wysyłki e-maili, więc otwieramy program pocztowy z gotową treścią.
    const emails = selectedProviders.map(p => p.email).filter(Boolean);
    if (emails.length > 0) {
      const subject = encodeURIComponent(`Zamówienie${clinicName ? ` – ${clinicName}` : ""}`);
      const body = encodeURIComponent(buildOrderEmail({ clinicName, items: products, notes }));
      window.location.href = `mailto:?bcc=${emails.join(",")}&subject=${subject}&body=${body}`;
    }

    const providersList = selectedProviders.map(p => p.label).join(", ");
    setProducts([]);
    setNotes("");
    setSelectedProviders([]);
    showMessage(`Zamówienie zapisane (${providersList}). Treść e-maila otwarto w programie pocztowym.`);
  };

  const calculateTotalCost = () => {
    return products.reduce((total, product) => {
      const priceToUse = product.bestPrice || product.price || 0;
      return total + product.quantity * priceToUse;
    }, 0);
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert("Brak produktów do eksportu.");
      return;
    }
    
    const headers = "Nazwa produktu,Kategoria,Ilość,Cena jednostkowa,Wartość,Dostawca\n";
    const csvContent = products.map(product => {
      const price = product.bestPrice || product.price || 0;
      const value = product.quantity * price;
      return `"${product.name}","${product.category || ''}",${product.quantity},${price.toFixed(2)},${value.toFixed(2)},"${product.bestSupplier || ''}"`;
    }).join("\n");
    
    const totalValue = calculateTotalCost();
    const summary = `\n\nPodsumowanie:,,,,"${formatMoney(totalValue)}",`;
    
    const blob = new Blob([headers + csvContent + summary], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `lista_zakupow_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const STATUS_BADGE = {
    "W realizacji": "badge-info",
    "Wysłane": "badge-warning",
    "Dostarczone": "badge-success",
  };

  const totalCost = calculateTotalCost();

  return (
    <div className="shopping-list page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Lista zakupów</h1>
          <p className="page-subtitle">Zbierz produkty, porównaj ceny i wyślij zamówienie do dostawców.</p>
        </div>
        {products.length > 0 && (
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download /> Eksportuj CSV
          </button>
        )}
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      <div className="tabs" role="tablist">
        {[
          { id: "build", label: "Lista" },
          { id: "compare", label: "Porównanie cen" },
          { id: "templates", label: "Szablony" },
        ].map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "build" && products.length > 0 && <span className="tab-count num">{products.length}</span>}
          </button>
        ))}
      </div>

      {/* Lista */}
      {activeTab === "build" && (
        <div className="sl-layout">
          <div className="sl-main">
            <section className="card sl-add">
              <div className="sl-add-head">
                <h3>Dodaj produkt</h3>
                <div className="sl-quick-amount">
                  <span className="muted">Ilość przy dodawaniu</span>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => setQuickAddAmount(Math.max(1, quickAddAmount - 1))}
                      aria-label="Zmniejsz ilość"
                    >
                      −
                    </button>
                    <span className="num">{quickAddAmount}</span>
                    <button
                      type="button"
                      onClick={() => setQuickAddAmount(quickAddAmount + 1)}
                      aria-label="Zwiększ ilość"
                    >
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
                    onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Kategoria"
                >
                  <option value="all">Wszystkie kategorie</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {showSuggestions && filteredProducts.length > 0 && (
                  <ul className="sl-suggestions">
                    {filteredProducts.map((product, index) => {
                      const bestOffer = getBestSupplier(product.name);
                      return (
                        <li key={index}>
                          <button type="button" onClick={() => handleAddProduct(product)}>
                            <span className="sl-suggestion-main">
                              <span className="sl-suggestion-name">{product.name}</span>
                              <span className="sl-suggestion-meta">
                                {product.category}
                                {bestOffer && ` · ${bestOffer.supplier}`}
                              </span>
                            </span>
                            <span className="num muted">{formatPrice(bestOffer?.price ?? product.price ?? 0)}</span>
                            <span className="sl-suggestion-add">Dodaj {quickAddAmount}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {smartSuggestions.length > 0 && (
                <div className="sl-related">
                  <span className="section-label">Często kupowane razem</span>
                  <div className="sl-related-list">
                    {smartSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAddProduct(suggestion)}
                      >
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
                <h3>Na liście <span className="muted num">({products.length})</span></h3>
                <label className="sl-check">
                  <input
                    type="checkbox"
                    checked={groupByCategory}
                    onChange={(e) => setGroupByCategory(e.target.checked)}
                  />
                  Grupuj według kategorii
                </label>
              </div>

              {products.length > 0 ? (
                <div className="table-wrap">
                  <table className="sl-table">
                    <thead>
                      <tr>
                        <th>Produkt</th>
                        <th className="right">Cena</th>
                        <th>Ilość</th>
                        <th className="right">Wartość</th>
                        <th aria-label="Akcje"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                        <React.Fragment key={category}>
                          {groupByCategory && (
                            <tr className="sl-group-row">
                              <td colSpan={5}>
                                {category} <span className="muted num">· {categoryProducts.length}</span>
                              </td>
                            </tr>
                          )}
                          {categoryProducts.map((product) => {
                            const globalIndex = products.findIndex(p => p === product);
                            const unitPrice = product.bestPrice || product.price || 0;
                            return (
                              <tr key={globalIndex}>
                                <td>
                                  <span className="sl-product-name">{product.name}</span>
                                  {product.bestSupplier && (
                                    <span className="sl-product-meta">{product.bestSupplier}</span>
                                  )}
                                </td>
                                <td className="right num muted">{formatPrice(unitPrice)}</td>
                                <td>
                                  <div className="sl-qty">
                                    <div className="stepper">
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(globalIndex, product.quantity - 1)}
                                        aria-label="Zmniejsz ilość"
                                      >
                                        −
                                      </button>
                                      <span className="num">{product.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(globalIndex, product.quantity + 1)}
                                        aria-label="Zwiększ ilość"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => handleQuantityChange(globalIndex, product.quantity + 5)}
                                      title="Dodaj 5"
                                    >
                                      +5
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => handleQuantityChange(globalIndex, Math.max(1, product.quantity - 2))}
                                      title="Odejmij 2"
                                    >
                                      −2
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => handleAddProduct({ name: product.name, category: product.category })}
                                      title={`Dodaj ${quickAddAmount} (ilość przy dodawaniu)`}
                                    >
                                      +{quickAddAmount}
                                    </button>
                                  </div>
                                </td>
                                <td className="right num">{formatPrice(unitPrice * product.quantity)}</td>
                                <td className="right">
                                  <button
                                    type="button"
                                    className="sl-remove"
                                    onClick={() => handleRemoveProduct(globalIndex)}
                                    aria-label={`Usuń ${product.name}`}
                                    title="Usuń z listy"
                                  >
                                    <X />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="sl-empty">
                  <p>Lista jest pusta.</p>
                  <p className="muted">Wyszukaj produkt powyżej, dodaj go z bazy produktów albo skorzystaj z szablonu.</p>
                </div>
              )}
            </section>
          </div>

          {products.length > 0 && (
            <aside className="card sl-summary">
              <h3>Zamówienie</h3>
              <dl className="sl-totals">
                <dt>Pozycji</dt>
                <dd className="num">{products.length}</dd>
                <dt>Wartość (znane ceny)</dt>
                <dd className="num sl-total-value">{formatMoney(totalCost)}</dd>
              </dl>

              <label className="sl-field">
                <span className="sl-field-label">Uwagi do zamówienia</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Np. termin dostawy, numer gabinetu"
                />
              </label>

              <fieldset className="sl-field sl-suppliers">
                <legend className="sl-field-label">Dostawcy</legend>
                {suppliers.map(supplier => (
                  <label key={supplier.value} className="sl-check">
                    <input
                      type="checkbox"
                      checked={selectedProviders.some(p => p.value === supplier.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProviders([...selectedProviders, supplier]);
                        } else {
                          setSelectedProviders(selectedProviders.filter(p => p.value !== supplier.value));
                        }
                      }}
                    />
                    <span>{supplier.label}</span>
                    {supplier.email && <span className="sl-supplier-email muted">{supplier.email}</span>}
                  </label>
                ))}
              </fieldset>

              <button
                onClick={handleSendOrder}
                className="btn btn-primary sl-send"
                disabled={selectedProviders.length === 0}
              >
                <Send /> Wyślij zamówienie
              </button>
              <p className="sl-hint muted">
                Zamówienie trafi do historii, a program pocztowy otworzy gotową wiadomość.
              </p>
            </aside>
          )}
        </div>
      )}

      {/* Porównanie cen */}
      {activeTab === "compare" && (
        <section className="card card-flush">
          <div className="sl-list-head">
            <h3>Porównanie cen dostawców</h3>
          </div>
          {products.length > 0 && !products.some(p => productOptions.find(o => o.name === p.name)?.supplierPrices) && (
            <p className="sl-info">
              Baza produktów nie zawiera jeszcze cen od dostawców (pole <code>supplierPrices</code>),
              więc nie ma czego porównać. Ceny ofert dostawców można sprawdzić na ekranie „Porównanie ofert”.
            </p>
          )}
          {products.length > 0 ? (
            <div className="table-wrap">
              <table className="sl-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th className="right">Ilość</th>
                    {suppliers.map(supplier => (
                      <th key={supplier.value} className="right">{supplier.label}</th>
                    ))}
                    <th>Najlepsza oferta</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const productData = productOptions.find(p => p.name === product.name);
                    const supplierPrices = productData?.supplierPrices || {};
                    const bestOffer = getBestSupplier(product.name);

                    return (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td className="right num">{product.quantity}</td>
                        {suppliers.map(supplier => {
                          const price = supplierPrices[supplier.value];
                          const totalPrice = price ? (price * product.quantity) : 0;
                          const isBest = bestOffer?.supplier === supplier.value;

                          return (
                            <td key={supplier.value} className={`right num ${isBest ? "sl-best" : ""}`}>
                              {price ? (
                                <>
                                  <span className="sl-unit-price">{formatMoney(price)}</span>
                                  <span className="sl-line-total">{formatMoney(totalPrice)}</span>
                                </>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td>
                          {bestOffer ? (
                            <>
                              <span className="sl-product-name">{bestOffer.supplier}</span>
                              <span className="sl-product-meta num">
                                {formatMoney((bestOffer.price * product.quantity))}
                              </span>
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2">Razem</td>
                    {suppliers.map(supplier => {
                      const total = products.reduce((sum, product) => {
                        const productData = productOptions.find(p => p.name === product.name);
                        const price = productData?.supplierPrices?.[supplier.value] || 0;
                        return sum + (price * product.quantity);
                      }, 0);

                      return (
                        <td key={supplier.value} className="right num">{formatMoney(total)}</td>
                      );
                    })}
                    <td className="num">{formatMoney(totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="sl-info">Dodaj produkty do listy, aby porównać ceny.</p>
          )}
        </section>
      )}

      {/* Szablony */}
      {activeTab === "templates" && (
        <div className="sl-templates">
          {templates.map(template => (
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
              <button
                className="btn btn-secondary"
                onClick={() => handleApplyTemplate(template)}
              >
                <Plus /> Dodaj do listy
              </button>
            </section>
          ))}
        </div>
      )}

      {/* Historia zamówień */}
      <section className="card card-flush sl-history">
        <div className="sl-list-head">
          <h3>Ostatnie zamówienia</h3>
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
                      {order.items.slice(0, 3).map(product => `${product.name} (${product.quantity})`).join(", ")}
                      {order.items.length > 3 && (
                        <span className="muted"> i {order.items.length - 3} więcej</span>
                      )}
                    </td>
                    <td className="right num">{formatPrice(order.amount)}</td>
                    <td className="right sl-nowrap">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(order)}>
                        Podgląd
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setProducts(order.items.map(i => createListItem(i, i.quantity)));
                          setNotes(order.notes);
                          setActiveTab("build");
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
          <div
            className="sl-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sl-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sl-modal-head">
              <h3 id="sl-modal-title">Szczegóły zamówienia</h3>
              <button
                type="button"
                className="sl-remove"
                onClick={() => setSelectedOrder(null)}
                aria-label="Zamknij"
              >
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
                    {product.price > 0 && ` · ${formatMoney((product.quantity * product.price))}`}
                  </span>
                </li>
              ))}
            </ul>
            <div className="sl-modal-actions">
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
