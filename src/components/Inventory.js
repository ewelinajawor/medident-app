import React, { useState, useEffect } from 'react';
import './Inventory.css';
import { FaBox, FaTools, FaFlask, FaPlus, FaShoppingCart, FaSearch, FaTrash } from 'react-icons/fa'; // Dodano ikonę kosza

function Inventory() {
  const [shoppingList, setShoppingList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([
    { id: 1, name: 'Masa wyciskowa', category: 'Materiały', stock: 10, minStock: 5 },
    { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', stock: 3, minStock: 5 },
    { id: 3, name: 'Żel do wycisków', category: 'Materiały', stock: 8, minStock: 4 },
    { id: 4, name: 'Środek do czyszczenia', category: 'Środki', stock: 15, minStock: 10 },
    { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', stock: 2, minStock: 5 },
  ]);

  // Dodaj produkty do listy zakupów
  const addToShoppingList = () => {
    const newShoppingList = products
      .filter((product) => product.stock < product.minStock)
      .map((product) => ({
        ...product,
        quantity: product.minStock - product.stock,
        addedAutomatically: true,
      }));
    setShoppingList(newShoppingList);
  };

  // Dodaj produkt ręcznie
  const handleAddToShoppingList = (product) => {
    const existingProduct = shoppingList.find((item) => item.id === product.id);
    if (existingProduct) {
      setShoppingList((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setShoppingList((prev) => [...prev, { ...product, quantity: 1, addedAutomatically: false }]);
    }
  };

  // Edytuj ilość produktu w liście zakupów
  const handleEditQuantity = (id, quantity) => {
    if (quantity < 1) return; // Nie pozwól na ujemną ilość
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // Usuń produkt z listy zakupów
  const handleRemoveFromShoppingList = (id) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  // Filtruj produkty według kategorii i wyszukiwania
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Efekt automatycznego dodawania produktów
  useEffect(() => {
    addToShoppingList();
  }, [products]);

  return (
    <div className="inventory">
      <h2 className="gradient-header">Stan magazynowy</h2>

      {/* Wyszukiwarka */}
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Wyszukaj produkt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filtry kategorii */}
      <div className="filters">
        <button
          className={`filter-btn ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('')}
        >
          <FaBox /> Wszystkie
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'Materiały' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Materiały')}
        >
          <FaBox /> Materiały
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'Sprzęt' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Sprzęt')}
        >
          <FaTools /> Sprzęt
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'Środki' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Środki')}
        >
          <FaFlask /> Środki
        </button>
      </div>

      {/* Lista produktów */}
      <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`product-card ${product.stock < product.minStock ? 'low-stock' : ''}`}>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p><strong>Kategoria:</strong> {product.category}</p>
              <p><strong>Zapasy:</strong> {product.stock}/{product.minStock}</p>
              <div className="progress-bar">
                <div
                  className="progress"
                  style={{ width: `${(product.stock / product.minStock) * 100}%` }}
                ></div>
              </div>
            </div>
            <button className="add-btn" onClick={() => handleAddToShoppingList(product)}>
              <FaPlus /> Dodaj do listy
            </button>
          </div>
        ))}
      </div>

      {/* Lista zakupów */}
      <h3 className="gradient-header">Lista zakupów</h3>
      <div className="shopping-list">
        {shoppingList.length > 0 ? (
          shoppingList.map((item) => (
            <div key={item.id} className="shopping-item">
              <p>{item.name} - {item.quantity} szt.</p>
              <div className="shopping-item-actions">
                <button onClick={() => handleEditQuantity(item.id, item.quantity + 1)}>+</button>
                <button onClick={() => handleEditQuantity(item.id, item.quantity - 1)}>-</button>
                <button onClick={() => handleRemoveFromShoppingList(item.id)}><FaTrash /></button>
              </div>
              {item.addedAutomatically && <span className="auto-tag">Automatycznie dodane</span>}
            </div>
          ))
        ) : (
          <p>Brak produktów do dodania</p>
        )}
      </div>

      {/* Przycisk uzupełnienia zapasów */}
      <button className="gradient-btn" onClick={addToShoppingList}>
        <FaShoppingCart /> Uzupełnij zapasy
      </button>
    </div>
  );
}

export default Inventory;