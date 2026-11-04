import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, ShoppingCart, PackagePlus, PackageMinus } from 'lucide-react';
import './Inventory.css';
import { KEYS, readJSON, writeJSON, addToShoppingList } from '../utils/storage';

// Katalog ma ponad 11 tys. pozycji – renderujemy je partiami, żeby strona nie zamarzała.
const CATALOG_PAGE_SIZE = 60;

const UNIT_MAP = { 'op.': 'opak', 'szt': 'szt', 'kpl.': 'kpl', 'para': 'para' };

function Inventory() {
  const [productCatalog, setProductCatalog] = useState([]); // Katalog z JSON
  const [inventoryStock, setInventoryStock] = useState(() => readJSON(KEYS.inventory, [])); // Aktualny stan magazynu
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [visibleCatalogCount, setVisibleCatalogCount] = useState(CATALOG_PAGE_SIZE);
  const [message, setMessage] = useState('');
  const isFirstSave = useRef(true);
  
  // UI States
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'receive', 'issue'
  
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
        
        // Ensure all products have required fields
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
        // Fallback catalog
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

  const handleAddToShoppingList = (item) => {
    const shortage = item.minStock - item.quantity;
    addToShoppingList({ name: item.name, category: item.category, quantity: shortage > 0 ? shortage : 1 });
    showMessage(`Dodano „${item.name}” do listy zakupów.`);
  };

  // Get unique categories from catalog
  const availableCategories = [...new Set(productCatalog.map(product => product.category))].sort();

  // Filter catalog products for search
  const filteredCatalogProducts = productCatalog.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter inventory stock
  const filteredStock = inventoryStock.filter((item) => {
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Get stock statistics
  const totalItems = inventoryStock.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventoryStock.filter(item => item.quantity < item.minStock).length;
  const outOfStockItems = inventoryStock.filter(item => item.quantity === 0).length;

  // Function to receive goods (add to inventory)
  const receiveGoods = (catalogProduct, quantity, note = '') => {
    const stockRef = String(catalogProduct.id).startsWith('stock:') ? String(catalogProduct.id).slice(6) : null;
    const existingIndex = inventoryStock.findIndex(item =>
      stockRef ? String(item.id) === stockRef : item.catalogId === catalogProduct.id
    );
    
    if (existingIndex >= 0) {
      // Update existing stock
      setInventoryStock(prev => prev.map((item, index) => 
        index === existingIndex 
          ? { ...item, quantity: item.quantity + quantity, lastReceived: new Date().toISOString() }
          : item
      ));
    } else {
      // Add new item to inventory
      const newStockItem = {
        id: Date.now(),
        catalogId: catalogProduct.id,
        name: catalogProduct.name,
        category: catalogProduct.category,
        description: catalogProduct.description,
        unit: catalogProduct.unit,
        minStock: catalogProduct.minStock,
        quantity: quantity,
        lastReceived: new Date().toISOString(),
        notes: note ? [{ date: new Date().toISOString(), text: note, type: 'receive' }] : []
      };
      setInventoryStock(prev => [...prev, newStockItem]);
    }
  };

  // Function to issue goods (remove from inventory)
  const issueGoods = (stockItem, quantity, note = '') => {
    if (quantity > stockItem.quantity) {
      alert('Nie można wydać więcej niż jest dostępne na stanie!');
      return false;
    }

    setInventoryStock(prev => prev.map(item => 
      item.id === stockItem.id 
        ? { 
            ...item, 
            quantity: item.quantity - quantity,
            lastIssued: new Date().toISOString(),
            notes: note ? [...(item.notes || []), { date: new Date().toISOString(), text: note, type: 'issue' }] : item.notes
          }
        : item
    ));
    return true;
  };

  // Handle receive modal
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

  // Handle issue modal
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

  // Add custom product to catalog
  const addCustomProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      alert('Nazwa produktu jest wymagana');
      return;
    }

    const customProduct = {
      id: `custom_${Date.now()}`,
      name: newProduct.name,
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
    if (item.quantity === 0) return <span className="badge badge-danger">Brak</span>;
    if (item.quantity < item.minStock) return <span className="badge badge-warning">Niski stan</span>;
    return <span className="badge badge-success">W normie</span>;
  };

  const issuableStock = filteredStock.filter(item => item.quantity > 0);

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

  return (
    <div className="inventory-page page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Magazyn</h1>
          <p className="page-subtitle">Ostatnia aktualizacja: {lastUpdate}</p>
        </div>
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">Produktów w magazynie</span>
          <span className="stat-value num">{inventoryStock.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Łączna ilość</span>
          <span className="stat-value num">{totalItems}</span>
        </div>
        <div className={`stat ${lowStockItems > 0 ? 'warning' : ''}`}>
          <span className="stat-label">Niski stan</span>
          <span className="stat-value num">{lowStockItems}</span>
        </div>
        <div className={`stat ${outOfStockItems > 0 ? 'danger' : ''}`}>
          <span className="stat-label">Brak na stanie</span>
          <span className="stat-value num">{outOfStockItems}</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
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
            placeholder={activeTab === 'stock' ? 'Szukaj w magazynie' : 'Szukaj produktu'}
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
          {availableCategories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
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
                    <th>Produkt</th>
                    <th className="hide-sm">Kategoria</th>
                    <th className="right">Stan</th>
                    <th className="right hide-sm">Minimum</th>
                    <th>Status</th>
                    <th aria-label="Akcje"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="item-name">{item.name}</span>
                        {item.description && <span className="item-desc">{item.description}</span>}
                      </td>
                      <td className="muted hide-sm">{item.category}</td>
                      <td className="right num nowrap">{item.quantity} {item.unit}</td>
                      <td className="right num muted hide-sm">{item.minStock}</td>
                      <td>{stockStatus(item)}</td>
                      <td className="right">
                        <div className="row-actions">
                          {item.quantity < item.minStock && (
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
                        </div>
                      </td>
                    </tr>
                  ))}
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
                          <td className="right num muted hide-sm">{product.minStock}</td>
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
    </div>
  );
}

export default Inventory;
