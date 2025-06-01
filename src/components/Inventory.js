import React, { useState, useEffect } from 'react';
import './Inventory.css';

function Inventory() {
  const [productCatalog, setProductCatalog] = useState([]); // Katalog z JSON
  const [inventoryStock, setInventoryStock] = useState([]); // Aktualny stan magazynu
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  
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
        const response = await fetch('/dental_products.json');
        const catalog = await response.json();
        
        // Ensure all products have required fields
        const processedCatalog = catalog.map((product, index) => ({
          id: product.id || `catalog_${index}`,
          name: product.name || 'Unnamed Product',
          category: product.category || 'Inne',
          description: product.description || '',
          unit: product.unit || 'szt',
          minStock: product.minStock || 5
        }));
        
        setProductCatalog(processedCatalog);
        console.log(`Loaded ${processedCatalog.length} products to catalog`);
        
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

  // Load inventory stock from localStorage
  useEffect(() => {
    const savedStock = localStorage.getItem('inventoryStock');
    if (savedStock) {
      try {
        const stock = JSON.parse(savedStock);
        setInventoryStock(stock);
      } catch (error) {
        console.error('Error loading inventory stock:', error);
        setInventoryStock([]);
      }
    }
  }, []);

  // Save inventory stock to localStorage
  useEffect(() => {
    if (!loadingCatalog) {
      try {
        localStorage.setItem('inventoryStock', JSON.stringify(inventoryStock));
        const now = new Date().toLocaleString();
        setLastUpdate(now);
        localStorage.setItem('lastInventoryUpdate', now);
      } catch (error) {
        console.error('Failed to save inventory stock:', error);
      }
    }
  }, [inventoryStock, loadingCatalog]);

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
    const existingIndex = inventoryStock.findIndex(item => item.catalogId === catalogProduct.id);
    
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
    setNewProduct({ name: '', category: 'Materiały', description: '', unit: 'szt' });
    setShowAddForm(false);
  };

  if (loadingCatalog) {
    return (
      <div className="inventory">
        <h2 className="gradient-header">Magazyn</h2>
        <div className="loading-message">
          <p>Ładowanie katalogu produktów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory">
      <h2 className="gradient-header">Magazyn</h2>

      {/* Statistics Panel */}
      <div className="summary-panel">
        <div className="summary-item">
          <span>Łączna ilość:</span>
          <strong>{totalItems} pozycji</strong>
        </div>
        <div className="summary-item">
          <span>Produktów w magazynie:</span>
          <strong>{inventoryStock.length}</strong>
        </div>
        <div className="summary-item low-stock">
          <span>Niski stan:</span>
          <strong>{lowStockItems}</strong>
        </div>
        <div className="summary-item critical-stock">
          <span>Brak na stanie:</span>
          <strong>{outOfStockItems}</strong>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'stock' ? 'active' : ''}
          onClick={() => setActiveTab('stock')}
        >
          📦 Stan magazynu
        </button>
        <button 
          className={activeTab === 'receive' ? 'active' : ''}
          onClick={() => setActiveTab('receive')}
        >
          📥 Przyjęcie towaru
        </button>
        <button 
          className={activeTab === 'issue' ? 'active' : ''}
          onClick={() => setActiveTab('issue')}
        >
          📤 Wydanie towaru
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <input
          type="text"
          placeholder={activeTab === 'stock' ? "Szukaj w magazynie..." : "Szukaj produktu..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ul className="filters-list">
        <li>
          <button 
            className={selectedCategory === '' ? 'active' : ''}
            onClick={() => setSelectedCategory('')}
          >
            Wszystkie
          </button>
        </li>
        {availableCategories.map((category) => (
          <li key={category}>
            <button 
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>

      {/* Content based on active tab */}
      {activeTab === 'stock' && (
        <div className="stock-view">
          <h3>Aktualny stan magazynu</h3>
          {filteredStock.length === 0 ? (
            <div className="empty-state">
              <p>Brak produktów w magazynie spełniających kryteria wyszukiwania.</p>
              <p>Przejdź do zakładki "Przyjęcie towaru" aby dodać produkty.</p>
            </div>
          ) : (
            <div className="stock-grid">
              {filteredStock.map((item) => (
                <div key={item.id} className={`stock-card ${item.quantity === 0 ? 'out-of-stock' : item.quantity < item.minStock ? 'low-stock' : ''}`}>
                  <h4>{item.name}</h4>
                  <p className="category">Kategoria: {item.category}</p>
                  {item.description && <p className="description">{item.description}</p>}
                  <div className="quantity-info">
                    <span className="quantity">{item.quantity} {item.unit}</span>
                    <span className="min-stock">Min: {item.minStock}</span>
                  </div>
                  {item.quantity < item.minStock && (
                    <div className="warning">⚠️ Niski stan</div>
                  )}
                  <div className="stock-actions">
                    <button 
                      className="issue-btn"
                      onClick={() => openIssueModal(item)}
                      disabled={item.quantity === 0}
                    >
                      📤 Wydaj
                    </button>
                    <button 
                      className="receive-btn"
                      onClick={() => {
                        const catalogProduct = productCatalog.find(p => p.id === item.catalogId);
                        if (catalogProduct) openReceiveModal(catalogProduct);
                      }}
                    >
                      📥 Przyjmij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'receive' && (
        <div className="receive-view">
          <div className="section-header">
            <h3>Przyjęcie towaru do magazynu</h3>
            <button className="add-product-button" onClick={() => setShowAddForm(true)}>
              + Dodaj nowy produkt do katalogu
            </button>
          </div>
          
          {filteredCatalogProducts.length === 0 ? (
            <div className="empty-state">
              <p>Nie znaleziono produktów w katalogu.</p>
            </div>
          ) : (
            <div className="catalog-grid">
              {filteredCatalogProducts.map((product) => {
                const currentStock = inventoryStock.find(item => item.catalogId === product.id);
                return (
                  <div key={product.id} className="catalog-card">
                    <h4>{product.name}</h4>
                    <p className="category">{product.category}</p>
                    {product.description && <p className="description">{product.description}</p>}
                    <div className="stock-info">
                      <span>Stan: {currentStock ? currentStock.quantity : 0} {product.unit}</span>
                      <span>Min: {product.minStock}</span>
                    </div>
                    <button 
                      className="receive-btn"
                      onClick={() => openReceiveModal(product)}
                    >
                      📥 Przyjmij towar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'issue' && (
        <div className="issue-view">
          <h3>Wydanie towaru z magazynu</h3>
          {filteredStock.filter(item => item.quantity > 0).length === 0 ? (
            <div className="empty-state">
              <p>Brak produktów dostępnych do wydania.</p>
            </div>
          ) : (
            <div className="issue-grid">
              {filteredStock.filter(item => item.quantity > 0).map((item) => (
                <div key={item.id} className="issue-card">
                  <h4>{item.name}</h4>
                  <p className="category">{item.category}</p>
                  <div className="available-quantity">
                    Dostępne: <strong>{item.quantity} {item.unit}</strong>
                  </div>
                  <button 
                    className="issue-btn"
                    onClick={() => openIssueModal(item)}
                  >
                    📤 Wydaj towar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receive Modal */}
      {receiveModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Przyjęcie towaru</h3>
            <div className="product-details">
              <p><strong>Produkt:</strong> {selectedProduct.name}</p>
              <p><strong>Kategoria:</strong> {selectedProduct.category}</p>
              <p><strong>Jednostka:</strong> {selectedProduct.unit}</p>
            </div>
            <div className="form-group">
              <label>Ilość:</label>
              <input
                type="number"
                min="1"
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="form-group">
              <label>Notatka (opcjonalna):</label>
              <textarea
                value={receiveNote}
                onChange={(e) => setReceiveNote(e.target.value)}
                placeholder="Np. dostawca, numer faktury..."
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setReceiveModal(false)}>Anuluj</button>
              <button onClick={confirmReceive} className="primary">Przyjmij</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {issueModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Wydanie towaru</h3>
            <div className="product-details">
              <p><strong>Produkt:</strong> {selectedProduct.name}</p>
              <p><strong>Dostępne:</strong> {selectedProduct.quantity} {selectedProduct.unit}</p>
            </div>
            <div className="form-group">
              <label>Ilość do wydania:</label>
              <input
                type="number"
                min="1"
                max={selectedProduct.quantity}
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="form-group">
              <label>Cel wydania (opcjonalne):</label>
              <textarea
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="Np. pacjent, gabinet, procedura..."
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setIssueModal(false)}>Anuluj</button>
              <button 
                onClick={confirmIssue} 
                className="primary"
                disabled={issueQuantity > selectedProduct.quantity}
              >
                Wydaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Product Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Dodaj nowy produkt do katalogu</h3>
            <form onSubmit={addCustomProduct}>
              <div className="form-group">
                <label>Nazwa produktu:</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Kategoria:</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Lub wpisz nową kategorię..."
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  style={{ marginTop: '5px' }}
                />
              </div>
              <div className="form-group">
                <label>Opis (opcjonalny):</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Jednostka:</label>
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
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Anuluj</button>
                <button type="submit" className="primary">Dodaj</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="inventory-footer">
        <div className="last-update">
          Ostatnia aktualizacja: {lastUpdate}
        </div>
      </div>
    </div>
  );
}

export default Inventory;