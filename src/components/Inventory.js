import React, { useState, useEffect } from 'react';
import './Inventory.css';

function Inventory() {
  // Stan dla wszystkich produktów z obsługą localStorage
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('dentalInventory');
    if (savedProducts) {
      try {
        return JSON.parse(savedProducts);
      } catch (error) {
        console.error("Błąd przy wczytywaniu danych:", error);
        // Fallback do danych domyślnych
        return [
          { id: 1, name: 'Masa wyciskowa', category: 'Materiały', stock: 10, minStock: 5 },
          { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', stock: 3, minStock: 5 },
          { id: 3, name: 'Żel do wycisków', category: 'Materiały', stock: 8, minStock: 4 },
          { id: 4, name: 'Środek do czyszczenia', category: 'Środki', stock: 15, minStock: 10 },
          { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', stock: 2, minStock: 5 },
        ];
      }
    } else {
      // Dane domyślne, jeśli nie ma zapisanych
      return [
        { id: 1, name: 'Masa wyciskowa', category: 'Materiały', stock: 10, minStock: 5 },
        { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', stock: 3, minStock: 5 },
        { id: 3, name: 'Żel do wycisków', category: 'Materiały', stock: 8, minStock: 4 },
        { id: 4, name: 'Środek do czyszczenia', category: 'Środki', stock: 15, minStock: 10 },
        { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', stock: 2, minStock: 5 },
      ];
    }
  });

  // Stan dla wybranej kategorii
  const [selectedCategory, setSelectedCategory] = useState('');

  // Stan dla zapytania wyszukiwania
  const [searchQuery, setSearchQuery] = useState('');

  // Stan dla edycji bezpośredniej ilości
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState({});

  // Stan dla formularza dodawania produktu
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Materiały',
    stock: 0,
    minStock: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Stan dla produktów w koszyku zamówień
  const [orderCart, setOrderCart] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Stan dla ostatniej aktualizacji
  const [lastUpdate, setLastUpdate] = useState(() => {
    const lastSaved = localStorage.getItem('lastInventoryUpdate');
    return lastSaved || new Date().toLocaleString();
  });

  // Efekt zapisujący dane przy każdej zmianie
  useEffect(() => {
    localStorage.setItem('dentalInventory', JSON.stringify(products));
    const now = new Date().toLocaleString();
    setLastUpdate(now);
    localStorage.setItem('lastInventoryUpdate', now);
  }, [products]);

  // Funkcja określająca stan zapasów
  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return 'empty';
    if (stock < minStock * 0.5) return 'critical';
    if (stock < minStock) return 'low';
    if (stock < minStock * 2) return 'good';
    return 'excess';
  };

  // Filtruj produkty
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Oblicz liczbę produktów z niskim i krytycznym stanem
  const lowStockProducts = products.filter((product) => product.stock < product.minStock).length;
  const criticalStockProducts = products.filter((product) => product.stock < product.minStock * 0.5).length;
  
  // Produkty wymagające natychmiastowego zamówienia
  const criticaProducts = products.filter(p => 
    getStockStatus(p.stock, p.minStock) === 'critical' || getStockStatus(p.stock, p.minStock) === 'empty'
  );

  // Aktualizuj stan magazynowy
  const handleUpdateStock = (id, newStock) => {
    if (newStock >= 0) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, stock: newStock } : product
        )
      );
    }
  };

  // Funkcje obsługi bezpośredniej edycji ilości
  const handleDirectEdit = (id, currentStock) => {
    setEditingId(id);
    setEditQuantity({ [id]: currentStock });
  };

  const handleQuantitySave = (id) => {
    const newQuantity = parseInt(editQuantity[id] || 0);
    if (newQuantity >= 0) {
      handleUpdateStock(id, newQuantity);
      setEditingId(null);
    }
  };

  // Usuń produkt
  const handleRemoveProduct = (id) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten produkt?")) {
      setProducts((prev) => prev.filter((product) => product.id !== id));
    }
  };

  // Funkcja dodająca nowy produkt
  const handleAddProduct = (e) => {
    e.preventDefault();
    
    // Walidacja formularza
    if (!newProduct.name || newProduct.stock < 0 || newProduct.minStock < 0) {
      alert('Proszę wypełnić wszystkie pola poprawnie.');
      return;
    }
    
    // Dodaj nowy produkt z unikalnym ID
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts([
      ...products,
      { ...newProduct, id: newId }
    ]);
    
    // Resetuj formularz
    setNewProduct({
      name: '',
      category: 'Materiały',
      stock: 0,
      minStock: 0
    });
    setShowAddForm(false);
  };

  // Funkcje zarządzania zamówieniami
  const addToOrder = (product) => {
    // Sprawdź, czy produkt już jest w koszyku
    const existingProduct = orderCart.find(item => item.id === product.id);
    
    if (existingProduct) {
      // Aktualizuj ilość, jeśli już jest w koszyku
      setOrderCart(orderCart.map(item => 
        item.id === product.id 
          ? { ...item, orderQuantity: item.orderQuantity + (product.minStock - product.stock) } 
          : item
      ));
    } else {
      // Dodaj nowy produkt do koszyka
      setOrderCart([
        ...orderCart, 
        { 
          ...product, 
          orderQuantity: product.minStock - product.stock > 0 ? product.minStock - product.stock : 1
        }
      ]);
    }
  };

  const removeFromOrder = (productId) => {
    setOrderCart(orderCart.filter(item => item.id !== productId));
  };

  const submitOrder = () => {
    // Tutaj można dodać integrację z systemem zamówień
    alert(`Zamówienie zostało wysłane!\nLiczba produktów: ${orderCart.length}`);
    setOrderCart([]);
    setShowOrderModal(false);
  };

  return (
    <div className="inventory">
      <h2 className="gradient-header">Stan magazynowy</h2>

      {/* Panel podsumowania */}
      <div className="summary-panel">
        <div className="summary-item low-stock">
          <span>Produkty z niskim stanem:</span>
          <strong>{lowStockProducts}</strong>
        </div>
        <div className="summary-item critical-stock">
          <span>Produkty z krytycznym stanem:</span>
          <strong>{criticalStockProducts}</strong>
        </div>
      </div>

      {/* Przycisk zamówienia */}
      <div className="order-manager">
        <button 
          className="view-order-button" 
          onClick={() => setShowOrderModal(true)}
          disabled={orderCart.length === 0}
        >
          🛒 Zamówienie ({orderCart.length})
        </button>
      </div>

      {/* Inteligentne powiadomienie */}
      {criticaProducts.length > 0 && (
        <div className="smart-notification">
          <div className="notification-icon">⚠️</div>
          <div className="notification-content">
            <h4>Uwaga! Produkty wymagające natychmiastowego zamówienia</h4>
            <ul>
              {criticaProducts.map(product => (
                <li key={product.id}>
                  {product.name} - stan: <strong>{product.stock}</strong> 
                  (minimum: {product.minStock})
                  <button 
                    onClick={() => addToOrder(product)} 
                    className="quick-order-btn"
                  >
                    Zamów teraz
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Wyszukiwarka */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Wyszukaj produkt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filtry kategorii */}
      <div className="filters">
        <button onClick={() => setSelectedCategory('')}>Wszystkie</button>
        <button onClick={() => setSelectedCategory('Materiały')}>Materiały</button>
        <button onClick={() => setSelectedCategory('Sprzęt')}>Sprzęt</button>
        <button onClick={() => setSelectedCategory('Środki')}>Środki</button>
      </div>

      {/* Przycisk dodawania produktu */}
      <div className="add-product-button-container">
        <button 
          className="add-product-button"
          onClick={() => setShowAddForm(true)}
        >
          + Dodaj nowy produkt
        </button>
      </div>

      {/* Widok kafelkowy */}
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            className={`product-tile ${getStockStatus(product.stock, product.minStock)}-stock`}
          >
            <h3>{product.name}</h3>
            <p>Kategoria: {product.category}</p>
            <p>Stan: {product.stock}/{product.minStock}</p>
            <div className="progress-bar">
              <div
                className={`progress ${getStockStatus(product.stock, product.minStock)}-indicator`}
                style={{ 
                  width: `${Math.min((product.stock / product.minStock) * 100, 100)}%`
                }}
              ></div>
            </div>
            {product.stock < product.minStock && <span className="warning-icon">⚠️</span>}
            <div className="quantity-controls">
              <button onClick={() => handleUpdateStock(product.id, product.stock - 1)}>-</button>
              
              {editingId === product.id ? (
                <div className="direct-edit">
                  <input
                    type="number"
                    min="0"
                    value={editQuantity[product.id] || ''}
                    onChange={(e) => setEditQuantity({ ...editQuantity, [product.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuantitySave(product.id)}
                  />
                  <button className="save-quantity" onClick={() => handleQuantitySave(product.id)}>✓</button>
                </div>
              ) : (
                <span onClick={() => handleDirectEdit(product.id, product.stock)}>{product.stock}</span>
              )}
              
              <button onClick={() => handleUpdateStock(product.id, product.stock + 1)}>+</button>
            </div>
            {product.stock < product.minStock && (
              <button 
                onClick={() => addToOrder(product)} 
                className="order-btn"
              >
                🛒 Zamów
              </button>
            )}
            <button onClick={() => handleRemoveProduct(product.id)} className="remove-btn">
              🗑️ Usuń
            </button>
          </div>
        ))}
      </div>

      {/* Tabela jako alternatywny widok */}
      <h3>Tabela produktów</h3>
      <table className="product-table">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Kategoria</th>
            <th>Stan</th>
            <th>Min. stan</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.id} className={getStockStatus(product.stock, product.minStock) + '-stock'}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.stock}</td>
              <td>{product.minStock}</td>
              <td>
                {product.stock < product.minStock && (
                  <button 
                    onClick={() => addToOrder(product)}
                    className="table-order-btn"
                  >
                    🛒
                  </button>
                )}
                <button onClick={() => handleRemoveProduct(product.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Informacja o ostatniej aktualizacji */}
      <div className="inventory-footer">
        <div className="last-update">
          Ostatnia aktualizacja: {lastUpdate}
        </div>
      </div>

      {/* Modal formularza dodawania produktu */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="add-product-form">
            <h3>Dodaj nowy produkt</h3>
            <form onSubmit={handleAddProduct}>
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
                  <option value="Materiały">Materiały</option>
                  <option value="Sprzęt">Sprzęt</option>
                  <option value="Środki">Środki</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Aktualny stan:</label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="form-group">
                <label>Minimalny stan:</label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="save-button">Zapisz</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddForm(false)}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal zamówienia */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="order-modal">
            <h3>Koszyk zamówień</h3>
            
            {orderCart.length === 0 ? (
              <p>Koszyk jest pusty</p>
            ) : (
              <>
                <table className="order-table">
                  <thead>
                    <tr>
                      <th>Produkt</th>
                      <th>Kategoria</th>
                      <th>Ilość</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderCart.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.orderQuantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              setOrderCart(orderCart.map(p => 
                                p.id === item.id ? {...p, orderQuantity: qty} : p
                              ));
                            }}
                          />
                        </td>
                        <td>
                          <button 
                            onClick={() => removeFromOrder(item.id)}
                            className="remove-from-order"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="form-buttons">
                  <button onClick={submitOrder} className="submit-order">
                    Wyślij zamówienie
                  </button>
                  <button 
                    onClick={() => setShowOrderModal(false)} 
                    className="cancel-button"
                  >
                    Anuluj
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;