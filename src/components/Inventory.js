import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, ShoppingCart, PackagePlus, PackageMinus, Pencil, ScanLine, Printer } from 'lucide-react';
import './Inventory.css';
import {
  KEYS,
  readJSON,
  writeJSON,
  addToShoppingList,
  stockLevel,
  STOCK_LEVEL_LABELS,
  getAlertLevel,
  getItemCode,
  findStockByCode,
} from '../utils/storage';
import EditItemModal from './inventory/EditItemModal';
import LabelSheet from './inventory/LabelSheet';
import ScanPanel from './inventory/ScanPanel';

// Katalog ma ponad 11 tys. pozycji – renderujemy je partiami, żeby strona nie zamarzała.
const CATALOG_PAGE_SIZE = 60;

const UNIT_MAP = { 'op.': 'opak', 'szt': 'szt', 'kpl.': 'kpl', 'para': 'para' };

const LEVEL_BADGE = { ok: 'badge-success', alert: 'badge-warning', low: 'badge-danger', out: 'badge-danger' };

const STORAGE_FULL_MESSAGE =
  'Nie udało się zapisać – pamięć przeglądarki jest pełna. Usuń zdjęcie tego produktu albo zdjęcia innych produktów i spróbuj ponownie.';

function Inventory() {
  const [productCatalog, setProductCatalog] = useState([]); // Katalog z JSON
  const [inventoryStock, setInventoryStock] = useState(() => readJSON(KEYS.inventory, [])); // Aktualny stan magazynu
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [visibleCatalogCount, setVisibleCatalogCount] = useState(CATALOG_PAGE_SIZE);
  const [message, setMessage] = useState('');
  const isFirstSave = useRef(true);

  // Lustro stanu – skaner potrzebuje aktualnej wartości od razu, zanim React przerenderuje stronę.
  const stockRef = useRef(inventoryStock);
  stockRef.current = inventoryStock;
  const commitStock = useCallback((next) => {
    stockRef.current = next;
    setInventoryStock(next);
  }, []);

  // UI States
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'receive', 'issue'
  const [showScanner, setShowScanner] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [labelItems, setLabelItems] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Receiving goods
  const [receiveModal, setReceiveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [receiveQuantity, setReceiveQuantity] = useState(1);
  const [receiveNote, setReceiveNote] = useState('');

  // Issuing goods
  const [issueModal, setIssueModal] = useState(false);
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [issueNote, setIssueNote] = useState('');

  // Manual product addition
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Materiały',
    description: '',
    unit: 'szt'
  });

  const [lastUpdate, setLastUpdate] = useState(() => {
    const lastSaved = localStorage.getItem('lastInventoryUpdate');
    return lastSaved || new Date().toLocaleString();
  });

  // Load product catalog from JSON
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/dental_products.json`);
        const catalog = await response.json();

        // Identyfikatory "catalog_<indeks>" zostają bez zmian, bo odwołują się do nich zapisane stany magazynu.
        const processedCatalog = catalog.map((product, index) => ({
          id: product.id || `catalog_${index}`,
          name: product.name || 'Produkt bez nazwy',
          category: product.category || 'Inne',
          description: product.description || '',
          unit: product.unit || UNIT_MAP[product.stock] || 'szt',
          minStock: product.minStock || 5
        }));

        setProductCatalog([...processedCatalog, ...readJSON(KEYS.customProducts, [])]);
      } catch (error) {
        console.error('Error loading product catalog:', error);
        setProductCatalog([
          { id: 1, name: 'Masa wyciskowa', category: 'Materiały', description: 'Masa do odcisków', unit: 'opak', minStock: 5 },
          { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', description: 'Podstawowe narzędzia', unit: 'szt', minStock: 3 },
          { id: 3, name: 'Żel do wycisków', category: 'Materiały', description: 'Żel alginatowy', unit: 'tuba', minStock: 4 },
          { id: 4, name: 'Środek do czyszczenia', category: 'Środki', description: 'Środek dezynfekcyjny', unit: 'butelka', minStock: 10 },
          { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', description: 'Nożyczki sterylne', unit: 'szt', minStock: 2 }
        ]);
      }
      setLoadingCatalog(false);
    };

    loadCatalog();
  }, []);

  // Zapis stanu magazynu – tylko po faktycznej zmianie (nie przy pierwszym renderze).
  useEffect(() => {
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    writeJSON(KEYS.inventory, inventoryStock);
    const now = new Date().toLocaleString('pl-PL');
    setLastUpdate(now);
    localStorage.setItem(KEYS.inventoryUpdatedAt, now);
  }, [inventoryStock]);

  useEffect(() => {
    setVisibleCatalogCount(CATALOG_PAGE_SIZE);
  }, [searchQuery, selectedCategory]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  // Uzupełniamy do progu ostrzegawczego, tak jak lista generowana z braków.
  const handleAddToShoppingList = (item) => {
    addToShoppingList({
      name: item.name,
      category: item.category,
      quantity: Math.max(1, getAlertLevel(item) - item.quantity)
    });
    showMessage(`Dodano „${item.name}” do listy zakupów.`);
  };

  const availableCategories = [...new Set(productCatalog.map(product => product.category))].sort();
  const stockCategories = [...new Set(inventoryStock.map(item => item.category || 'Inne'))].sort();

  const query = searchQuery.toLowerCase();

  const filteredCatalogProducts = productCatalog.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(query) ||
                         (product.description || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const filteredStock = inventoryStock.filter((item) => {
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(query) ||
                         (item.description && item.description.toLowerCase().includes(query)) ||
                         getItemCode(item).toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  // Statystyki według czterech poziomów stanu
  const levelCounts = inventoryStock.reduce(
    (acc, item) => ({ ...acc, [stockLevel(item)]: acc[stockLevel(item)] + 1 }),
    { ok: 0, alert: 0, low: 0, out: 0 }
  );

  // Przyjęcie towaru (z katalogu albo istniejącej pozycji)
  const receiveGoods = (catalogProduct, quantity, note = '') => {
    const stock = stockRef.current;
    const stockRefId = String(catalogProduct.id).startsWith('stock:') ? String(catalogProduct.id).slice(6) : null;
    const existingIndex = stock.findIndex(item =>
      stockRefId ? String(item.id) === stockRefId : item.catalogId === catalogProduct.id
    );
    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      commitStock(stock.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              quantity: item.quantity + quantity,
              lastReceived: nowIso,
              notes: note ? [...(item.notes || []), { date: nowIso, text: note, type: 'receive' }] : item.notes
            }
          : item
      ));
    } else {
      commitStock([...stock, {
        id: Date.now(),
        catalogId: catalogProduct.id,
        name: catalogProduct.name,
        category: catalogProduct.category,
        description: catalogProduct.description,
        unit: catalogProduct.unit,
        minStock: catalogProduct.minStock,
        quantity,
        lastReceived: nowIso,
        notes: note ? [{ date: nowIso, text: note, type: 'receive' }] : []
      }]);
    }
  };

  // Wydanie towaru – zwraca false, gdy na stanie jest za mało.
  const issueGoods = (stockItem, quantity, note = '') => {
    const stock = stockRef.current;
    const current = stock.find(item => item.id === stockItem.id);
    if (!current || quantity > current.quantity) return false;
    const nowIso = new Date().toISOString();
    commitStock(stock.map(item =>
      item.id === stockItem.id
        ? {
            ...item,
            quantity: item.quantity - quantity,
            lastIssued: nowIso,
            notes: note ? [...(item.notes || []), { date: nowIso, text: note, type: 'issue' }] : item.notes
          }
        : item
    ));
    return true;
  };

  // ---------- Skanowanie ----------

  const handleScan = ({ code, mode, quantity }) => {
    const item = findStockByCode(stockRef.current, code);
    if (!item) return { unknown: true };
    const unit = item.unit || 'szt';
    if (mode === 'issue') {
      if (quantity > item.quantity) {
        return { error: `${item.name}: na stanie jest ${item.quantity} ${unit}, nie można wydać ${quantity}.` };
      }
      issueGoods(item, quantity, 'Skan');
    } else {
      receiveGoods({ ...item, id: `stock:${item.id}` }, quantity, 'Skan');
    }
    const delta = mode === 'issue' ? -quantity : quantity;
    return {
      entry: {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        itemId: item.id,
        name: item.name,
        unit,
        delta,
        newQuantity: item.quantity + delta
      }
    };
  };

  const handleUndoScan = (entry) => {
    const item = stockRef.current.find(s => s.id === entry.itemId);
    if (!item) return 'Tej pozycji nie ma już w magazynie.';
    if (entry.delta > 0 && item.quantity < entry.delta) {
      return `Nie można cofnąć – część towaru (${item.name}) została już wydana.`;
    }
    commitStock(stockRef.current.map(s =>
      s.id === entry.itemId ? { ...s, quantity: s.quantity - entry.delta } : s
    ));
    return null;
  };

  const handleAssignCode = (itemId, code) => {
    const stock = stockRef.current;
    if (findStockByCode(stock, code)) return `Kod „${code}” ma już inny produkt.`;
    commitStock(stock.map(s => (String(s.id) === String(itemId) ? { ...s, code } : s)));
    return null;
  };

  // ---------- Edycja pozycji ----------

  const handleSaveItem = (updated) => {
    const next = stockRef.current.map(s => (s.id === updated.id ? updated : s));
    // Zapis na próbę – zdjęcia potrafią przepełnić localStorage, a writeJSON tylko loguje błąd.
    try {
      localStorage.setItem(KEYS.inventory, JSON.stringify(next));
    } catch (error) {
      return STORAGE_FULL_MESSAGE;
    }
    commitStock(next);
    setEditingItem(null);
    showMessage(`Zapisano zmiany: ${updated.name}.`);
    return null;
  };

  // ---------- Etykiety ----------

  const toggleSelected = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const allFilteredSelected = filteredStock.length > 0 && filteredStock.every(item => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    const ids = filteredStock.map(item => item.id);
    setSelectedIds(prev => (allFilteredSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  const openLabels = () => {
    const chosen = inventoryStock.filter(item => selectedIds.includes(item.id));
    setLabelItems(chosen.length > 0 ? chosen : filteredStock);
  };

  const closeLabels = useCallback(() => setLabelItems(null), []);

  // ---------- Modale przyjęcia / wydania ----------

  const openReceiveModal = (product) => {
    setSelectedProduct(product);
    setReceiveQuantity(1);
    setReceiveNote('');
    setReceiveModal(true);
  };

  const confirmReceive = () => {
    if (selectedProduct && receiveQuantity > 0) {
      receiveGoods(selectedProduct, receiveQuantity, receiveNote);
      setReceiveModal(false);
      setSelectedProduct(null);
    }
  };

  const openIssueModal = (stockItem) => {
    setSelectedProduct(stockItem);
    setIssueQuantity(1);
    setIssueNote('');
    setIssueModal(true);
  };

  const confirmIssue = () => {
    if (selectedProduct && issueQuantity > 0) {
      if (issueGoods(selectedProduct, issueQuantity, issueNote)) {
        setIssueModal(false);
        setSelectedProduct(null);
      }
    }
  };

  const addCustomProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    const customProduct = {
      id: `custom_${Date.now()}`,
      name: newProduct.name.trim(),
      category: newProduct.category,
      description: newProduct.description,
      unit: newProduct.unit,
      minStock: 5,
      isCustom: true
    };

    setProductCatalog(prev => [...prev, customProduct]);
    writeJSON(KEYS.customProducts, [...readJSON(KEYS.customProducts, []), customProduct]);
    setNewProduct({ name: '', category: 'Materiały', description: '', unit: 'szt' });
    setShowAddForm(false);
  };

  const TABS = [
    { id: 'stock', label: 'Stan magazynu' },
    { id: 'receive', label: 'Przyjęcie towaru' },
    { id: 'issue', label: 'Wydanie towaru' }
  ];

  const stockStatus = (item) => {
    const level = stockLevel(item);
    return <span className={`badge ${LEVEL_BADGE[level]}`}>{STOCK_LEVEL_LABELS[level]}</span>;
  };

  const issuableStock = filteredStock.filter(item => item.quantity > 0);
  const categoryOptions = activeTab === 'stock' || activeTab === 'issue' ? stockCategories : availableCategories;

  if (loadingCatalog) {
    return (
      <div className="inventory-page page">
        <header className="page-header">
          <h1 className="page-title">Magazyn</h1>
        </header>
        <p className="muted">Ładowanie katalogu produktów…</p>
      </div>
    );
  }

  const stats = [
    { label: 'Produkty', value: inventoryStock.length, tone: '' },
    { label: 'Kończy się', value: levelCounts.alert, tone: levelCounts.alert > 0 ? 'warning' : '' },
    { label: 'Poniżej minimum', value: levelCounts.low, tone: levelCounts.low > 0 ? 'danger' : '' },
    { label: 'Brak na stanie', value: levelCounts.out, tone: levelCounts.out > 0 ? 'danger' : '' }
  ];

  return (
    <div className="inventory-page page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Magazyn</h1>
          <p className="page-subtitle">Ostatnia aktualizacja: {lastUpdate}</p>
        </div>
        <button
          type="button"
          className={`btn ${showScanner ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowScanner(s => !s)}
          aria-expanded={showScanner}
        >
          <ScanLine /> {showScanner ? 'Ukryj skanowanie' : 'Skanuj kody'}
        </button>
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      {showScanner && (
        <ScanPanel
          stock={inventoryStock}
          onScan={handleScan}
          onUndo={handleUndoScan}
          onAssign={handleAssignCode}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="stat-row">
        {stats.map(stat => (
          <div key={stat.label} className={`stat ${stat.tone}`}>
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value num">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setSelectedCategory(''); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-field">
          <Search className="search-field-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder={activeTab === 'stock' ? 'Szukaj po nazwie lub kodzie' : 'Szukaj produktu'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Szukaj"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Kategoria"
          className="category-select"
        >
          <option value="">Wszystkie kategorie</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {activeTab === 'stock' && inventoryStock.length > 0 && (
          <button className="btn btn-secondary toolbar-end" onClick={openLabels}>
            <Printer /> {selectedIds.length > 0 ? `Drukuj etykiety (${selectedIds.length})` : 'Drukuj etykiety'}
          </button>
        )}
        {activeTab === 'receive' && (
          <button className="btn btn-secondary toolbar-end" onClick={() => setShowAddForm(true)}>
            <Plus /> Nowy produkt w katalogu
          </button>
        )}
      </div>

      {activeTab === 'stock' && (
        filteredStock.length === 0 ? (
          <div className="empty-state">
            <h4>Brak produktów</h4>
            <p>Nic w magazynie nie pasuje do wyszukiwania. Nowe produkty dodasz w zakładce „Przyjęcie towaru”.</p>
          </div>
        ) : (
          <div className="card card-flush">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="check-col">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        aria-label="Zaznacz wszystkie do druku etykiet"
                      />
                    </th>
                    <th>Produkt</th>
                    <th className="hide-sm">Kategoria</th>
                    <th className="right">Stan</th>
                    <th className="right hide-sm" title="Minimum / próg ostrzegawczy">Min. / próg</th>
                    <th>Status</th>
                    <th aria-label="Akcje"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => {
                    const level = stockLevel(item);
                    return (
                      <tr key={item.id} className={selectedIds.includes(item.id) ? 'selected-row' : ''}>
                        <td className="check-col">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelected(item.id)}
                            aria-label={`Zaznacz: ${item.name}`}
                          />
                        </td>
                        <td>
                          <div className="item-cell">
                            {item.photo ? (
                              <img src={item.photo} alt="" className="item-thumb" />
                            ) : (
                              <span className="item-thumb item-thumb-empty" aria-hidden="true" />
                            )}
                            <span>
                              <span className="item-name">{item.name}</span>
                              <span className="item-code">{getItemCode(item)}</span>
                            </span>
                          </div>
                        </td>
                        <td className="muted hide-sm">{item.category}</td>
                        <td className="right num nowrap">{item.quantity} {item.unit}</td>
                        <td className="right num muted hide-sm nowrap">{item.minStock} / {getAlertLevel(item)}</td>
                        <td>{stockStatus(item)}</td>
                        <td className="right">
                          <div className="row-actions">
                            {level !== 'ok' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleAddToShoppingList(item)}
                                title="Dodaj do listy zakupów"
                                aria-label={`Dodaj do listy zakupów: ${item.name}`}
                              >
                                <ShoppingCart /> <span className="label-wide">Do listy</span>
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openIssueModal(item)}
                              disabled={item.quantity === 0}
                            >
                              Wydaj
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                // Pozycje przyjęte z zamówień mogą nie mieć odpowiednika w katalogu – wtedy używamy samej pozycji.
                                const catalogProduct = productCatalog.find(p => p.id === item.catalogId);
                                openReceiveModal(catalogProduct || { ...item, id: item.catalogId || `stock:${item.id}` });
                              }}
                            >
                              Przyjmij
                            </button>
                            <button
                              className="btn btn-ghost btn-sm icon-only"
                              onClick={() => setEditingItem(item)}
                              title="Edytuj"
                              aria-label={`Edytuj: ${item.name}`}
                            >
                              <Pencil />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {activeTab === 'receive' && (
        filteredCatalogProducts.length === 0 ? (
          <div className="empty-state">
            <h4>Nie znaleziono produktów w katalogu</h4>
            <p>Zmień wyszukiwanie albo dodaj nowy produkt do katalogu.</p>
          </div>
        ) : (
          <>
            <p className="list-meta muted">
              Wyświetlono {Math.min(visibleCatalogCount, filteredCatalogProducts.length)} z {filteredCatalogProducts.length} produktów
              {filteredCatalogProducts.length > visibleCatalogCount && ' – zawęź wyszukiwanie lub pokaż więcej'}
            </p>
            <div className="card card-flush">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Produkt</th>
                      <th className="hide-sm">Kategoria</th>
                      <th className="right">Na stanie</th>
                      <th className="right hide-sm">Minimum</th>
                      <th aria-label="Akcje"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalogProducts.slice(0, visibleCatalogCount).map((product) => {
                      const currentStock = inventoryStock.find(item => item.catalogId === product.id);
                      return (
                        <tr key={product.id}>
                          <td>
                            <span className="item-name">{product.name}</span>
                            {product.description && <span className="item-desc">{product.description}</span>}
                          </td>
                          <td className="muted hide-sm">{product.category}</td>
                          <td className="right num nowrap">{currentStock ? currentStock.quantity : 0} {product.unit}</td>
                          <td className="right num muted hide-sm">{currentStock ? currentStock.minStock : product.minStock}</td>
                          <td className="right">
                            <button className="btn btn-secondary btn-sm" onClick={() => openReceiveModal(product)}>
                              <PackagePlus /> Przyjmij
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredCatalogProducts.length > visibleCatalogCount && (
              <div className="load-more">
                <button
                  className="btn btn-secondary"
                  onClick={() => setVisibleCatalogCount(count => count + CATALOG_PAGE_SIZE)}
                >
                  Pokaż kolejne {CATALOG_PAGE_SIZE}
                </button>
              </div>
            )}
          </>
        )
      )}

      {activeTab === 'issue' && (
        issuableStock.length === 0 ? (
          <div className="empty-state">
            <h4>Brak produktów do wydania</h4>
            <p>Wszystkie pasujące pozycje mają zerowy stan.</p>
          </div>
        ) : (
          <div className="card card-flush">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th className="hide-sm">Kategoria</th>
                    <th className="right">Dostępne</th>
                    <th aria-label="Akcje"></th>
                  </tr>
                </thead>
                <tbody>
                  {issuableStock.map((item) => (
                    <tr key={item.id}>
                      <td><span className="item-name">{item.name}</span></td>
                      <td className="muted hide-sm">{item.category}</td>
                      <td className="right num nowrap">{item.quantity} {item.unit}</td>
                      <td className="right">
                        <button className="btn btn-secondary btn-sm" onClick={() => openIssueModal(item)}>
                          <PackageMinus /> Wydaj
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {receiveModal && selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="receive-title">
            <h2 id="receive-title" className="modal-title">Przyjęcie towaru</h2>
            <dl className="modal-facts">
              <dt>Produkt</dt><dd>{selectedProduct.name}</dd>
              <dt>Kategoria</dt><dd>{selectedProduct.category}</dd>
              <dt>Jednostka</dt><dd>{selectedProduct.unit}</dd>
            </dl>
            <label className="field">
              <span className="field-label">Ilość</span>
              <input
                type="number"
                min="1"
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || 1)}
              />
            </label>
            <label className="field">
              <span className="field-label">Notatka <span className="muted">(opcjonalnie)</span></span>
              <textarea
                value={receiveNote}
                onChange={(e) => setReceiveNote(e.target.value)}
                placeholder="Np. dostawca, numer faktury"
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setReceiveModal(false)}>Anuluj</button>
              <button className="btn btn-primary" onClick={confirmReceive}>Przyjmij</button>
            </div>
          </div>
        </div>
      )}

      {issueModal && selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="issue-title">
            <h2 id="issue-title" className="modal-title">Wydanie towaru</h2>
            <dl className="modal-facts">
              <dt>Produkt</dt><dd>{selectedProduct.name}</dd>
              <dt>Dostępne</dt><dd className="num">{selectedProduct.quantity} {selectedProduct.unit}</dd>
            </dl>
            <label className="field">
              <span className="field-label">Ilość do wydania</span>
              <input
                type="number"
                min="1"
                max={selectedProduct.quantity}
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(parseInt(e.target.value) || 1)}
              />
              {issueQuantity > selectedProduct.quantity && (
                <span className="field-error">Na stanie jest tylko {selectedProduct.quantity} {selectedProduct.unit}.</span>
              )}
            </label>
            <label className="field">
              <span className="field-label">Cel wydania <span className="muted">(opcjonalnie)</span></span>
              <textarea
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="Np. pacjent, gabinet, procedura"
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIssueModal(false)}>Anuluj</button>
              <button
                className="btn btn-primary"
                onClick={confirmIssue}
                disabled={issueQuantity > selectedProduct.quantity}
              >
                Wydaj
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title">
            <h2 id="add-title" className="modal-title">Nowy produkt w katalogu</h2>
            <form onSubmit={addCustomProduct}>
              <label className="field">
                <span className="field-label">Nazwa produktu</span>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
              </label>
              <div className="field">
                <span className="field-label">Kategoria</span>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  aria-label="Wybierz kategorię"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="lub wpisz nową kategorię"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  aria-label="Nowa kategoria"
                />
              </div>
              <label className="field">
                <span className="field-label">Opis <span className="muted">(opcjonalnie)</span></span>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </label>
              <label className="field">
                <span className="field-label">Jednostka</span>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                >
                  <option value="szt">szt</option>
                  <option value="opak">opak</option>
                  <option value="kg">kg</option>
                  <option value="l">l</option>
                  <option value="ml">ml</option>
                  <option value="tuba">tuba</option>
                  <option value="butelka">butelka</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Anuluj</button>
                <button type="submit" className="btn btn-primary">Dodaj</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          stock={inventoryStock}
          categories={stockCategories}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {labelItems && <LabelSheet items={labelItems} onClose={closeLabels} />}
    </div>
  );
}

export default Inventory;
