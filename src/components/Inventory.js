import React, { useState, useEffect } from 'react';
import './Inventory.css';

function Inventory() {
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('dentalInventory');
    if (savedProducts) {
      try {
        // Convert the saved data to include the new visible and inTable properties
        const parsedProducts = JSON.parse(savedProducts);
        return parsedProducts.map((p) => ({
          ...p,
          visible: p.visible !== undefined ? p.visible : true,
          inTable: p.inTable !== undefined ? p.inTable : false
        }));
      } catch (error) {
        return [
          { id: 1, name: 'Masa wyciskowa', category: 'Materiały', stock: 10, minStock: 5, visible: true, inTable: false },
          { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', stock: 3, minStock: 5, visible: true, inTable: false },
          { id: 3, name: 'Żel do wycisków', category: 'Materiały', stock: 8, minStock: 4, visible: true, inTable: false },
          { id: 4, name: 'Środek do czyszczenia', category: 'Środki', stock: 15, minStock: 10, visible: true, inTable: false },
          { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', stock: 2, minStock: 5, visible: true, inTable: false },
        ];
      }
    } else {
      return [
        { id: 1, name: 'Masa wyciskowa', category: 'Materiały', stock: 10, minStock: 5, visible: true, inTable: false },
        { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', stock: 3, minStock: 5, visible: true, inTable: false },
        { id: 3, name: 'Żel do wycisków', category: 'Materiały', stock: 8, minStock: 4, visible: true, inTable: false },
        { id: 4, name: 'Środek do czyszczenia', category: 'Środki', stock: 15, minStock: 10, visible: true, inTable: false },
        { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', stock: 2, minStock: 5, visible: true, inTable: false },
      ];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState({});
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Materiały',
    stock: 0,
    minStock: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(() => {
    const lastSaved = localStorage.getItem('lastInventoryUpdate');
    return lastSaved || new Date().toLocaleString();
  });
  const [issueModal, setIssueModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [issueQuantity, setIssueQuantity] = useState(1);

  useEffect(() => {
    localStorage.setItem('dentalInventory', JSON.stringify(products));
    const now = new Date().toLocaleString();
    setLastUpdate(now);
    localStorage.setItem('lastInventoryUpdate', now);
  }, [products]);

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return 'empty';
    if (stock < minStock * 0.5) return 'critical';
    if (stock < minStock) return 'low';
    if (stock < minStock * 2) return 'good';
    return 'excess';
  };

  // Filter products that should appear in the tile view
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.visible;
  });

  // Get products that should appear in the table view
  const tableProducts = products.filter(product => product.inTable);

  const lowStockProducts = products.filter((product) => product.stock < product.minStock).length;
  const criticalStockProducts = products.filter((product) => product.stock < product.minStock * 0.5).length;

  const handleUpdateStock = (id, newStock) => {
    if (newStock >= 0) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, stock: newStock } : product
        )
      );
    }
  };

  const handleDirectEdit = (id, currentStock) => {
    setEditingId(id);
    setEditQuantity({ [id]: currentStock });
  };

  const handleQuantitySave = (id) => {
    const newQuantity = parseInt(String(editQuantity[id] || 0));
    if (newQuantity >= 0) {
      handleUpdateStock(id, newQuantity);
      setEditingId(null);
    }
  };

  const handleRemoveProduct = (id) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten produkt?")) {
      setProducts((prev) => prev.filter((product) => product.id !== id));
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.stock < 0 || newProduct.minStock < 0) {
      alert('Proszę wypełnić wszystkie pola poprawnie.');
      return;
    }
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts([
      ...products,
      { ...newProduct, id: newId, visible: true, inTable: false }
    ]);
    setNewProduct({
      name: '',
      category: 'Materiały',
      stock: 0,
      minStock: 0
    });
    setShowAddForm(false);
  };

  // Add product to table and hide from grid
  const addToTable = (product) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === product.id 
          ? { ...p, visible: false, inTable: true } 
          : p
      )
    );
  };

  // Remove product from table and make visible in grid again
  const removeFromTable = (product) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === product.id 
          ? { ...p, visible: true, inTable: false } 
          : p
      )
    );
  };

  // Function to handle issuing products
  const handleIssueProduct = (product) => {
    setSelectedProduct(product);
    setIssueQuantity(1);
    setIssueModal(true);
  };

  // Function to complete the issue process
  const completeIssue = () => {
    if (selectedProduct && issueQuantity > 0) {
      // Check if quantity is valid
      if (issueQuantity > selectedProduct.stock) {
        alert('Nie można wydać więcej produktów niż jest na stanie.');
        return;
      }
      
      // Update the stock
      const newStock = selectedProduct.stock - issueQuantity;
      handleUpdateStock(selectedProduct.id, newStock);
      
      // Close the modal and reset values
      setIssueModal(false);
      setSelectedProduct(null);
      setIssueQuantity(1);
    }
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

      {/* Wyszukiwarka */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Wyszukaj produkt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filtry kategorii jako pozioma lista */}
      <ul className="filters-list">
        <li>
          <button onClick={() => setSelectedCategory('')}>Wszystkie</button>
        </li>
        <li>
          <button onClick={() => setSelectedCategory('Materiały')}>Materiały</button>
        </li>
        <li>
          <button onClick={() => setSelectedCategory('Sprzęt')}>Sprzęt</button>
        </li>
        <li>
          <button onClick={() => setSelectedCategory('Środki')}>Środki</button>
        </li>
      </ul>

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
                    onChange={(e) => setEditQuantity({ ...editQuantity, [product.id]: parseInt(e.target.value) || 0 })}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuantitySave(product.id)}
                  />
                  <button className="save-quantity" onClick={() => handleQuantitySave(product.id)}>✓</button>
                </div>
              ) : (
                <span onClick={() => handleDirectEdit(product.id, product.stock)}>{product.stock}</span>
              )}
              <button onClick={() => handleUpdateStock(product.id, product.stock + 1)}>+</button>
            </div>
            <div className="product-actions">
              <button
                onClick={() => addToTable(product)}
                className="add-to-table-btn"
              >
                Dodaj do tabeli
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela jako alternatywny widok */}
      <h3>Stan magazynowy</h3>
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
          {tableProducts.map((product) => (
            <tr key={product.id} className={getStockStatus(product.stock, product.minStock) + '-stock'}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.stock}</td>
              <td>{product.minStock}</td>
              <td className="table-actions">
                <button 
                  className="table-copy-btn"
                  onClick={() => {
                    const newId = Math.max(...products.map(p => p.id), 0) + 1;
                    const productCopy = { ...product, id: newId, visible: true, inTable: false };
                    setProducts(prev => [...prev, productCopy]);
                  }}
                >
                  📋 Kopiuj
                </button>
                <button 
                  className="table-issue-btn"
                  onClick={() => handleIssueProduct(product)}
                >
                  📤 Wydaj
                </button>
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
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Kategoria:</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
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
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Minimalny stan:</label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-buttons">
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-button">
                  Anuluj
                </button>
                <button type="submit" className="submit-button">
                  Dodaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for issuing products */}
      {issueModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="issue-product-form">
            <h3>Wydaj produkt</h3>
            <div className="product-issue-details">
              <p><strong>Nazwa:</strong> {selectedProduct.name}</p>
              <p><strong>Kategoria:</strong> {selectedProduct.category}</p>
              <p><strong>Dostępny stan:</strong> {selectedProduct.stock}</p>
            </div>
            <div className="form-group">
              <label>Ilość do wydania:</label>
              <input
                type="number"
                min="1"
                max={selectedProduct.stock}
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="form-buttons">
              <button type="button" onClick={() => setIssueModal(false)} className="cancel-button">
                Anuluj
              </button>
              <button 
                type="button" 
                className="submit-button"
                onClick={completeIssue}
                disabled={issueQuantity <= 0 || issueQuantity > selectedProduct.stock}
              >
                Wydaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;