import React, { useState, useEffect } from 'react';
import './Inventory.css';

function Inventory() {
  const [shoppingList, setShoppingList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(''); // Stan dla aktywnej kategorii
  const [products, setProducts] = useState([
    { id: 1, name: 'Masa wyciskowa', category: 'Materiały', stock: 10, minStock: 5 },
    { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', stock: 3, minStock: 5 },
    { id: 3, name: 'Żel do wycisków', category: 'Materiały', stock: 8, minStock: 4 },
    { id: 4, name: 'Środek do czyszczenia', category: 'Środki', stock: 15, minStock: 10 },
    { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', stock: 2, minStock: 5 },
  ]);

  // Funkcja dodająca produkty do listy zakupów, które są poniżej minimalnego poziomu zapasów
  const addToShoppingList = () => {
    const newShoppingList = [];

    products.forEach((product) => {
      if (product.stock < product.minStock) {  // Zapewnia, że produkty poniżej minimalnego poziomu zapasów będą dodane
        const quantity = product.minStock - product.stock;
        // Sprawdzamy, czy produkt już istnieje na liście
        const existingProductIndex = newShoppingList.findIndex((item) => item.name === product.name);
        if (existingProductIndex !== -1) {
          newShoppingList[existingProductIndex].quantity += quantity;
        } else {
          newShoppingList.push({ ...product, quantity, addedAutomatically: true });
        }
      }
    });

    setShoppingList(newShoppingList);
  };

  // Funkcja do dodania produktu do listy zakupów ręcznie
  const handleAddToShoppingList = (product) => {
    const newShoppingList = [...shoppingList];
    const existingProductIndex = newShoppingList.findIndex(item => item.name === product.name);

    if (existingProductIndex !== -1) {
      newShoppingList[existingProductIndex].quantity += 1; // Zwiększamy ilość dla istniejącego produktu
    } else {
      newShoppingList.push({ ...product, quantity: 1, addedAutomatically: false });
    }

    setShoppingList(newShoppingList);
  };

  // Zaktualizuj listę zakupów po załadowaniu komponentu
  useEffect(() => {
    addToShoppingList();
  }, [products]);

  // Zaktualizuj listę produktów według wybranej kategorii
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  return (
    <div className="inventory">
      <h2 className="gradient-header">Zarządzanie zapasami</h2>

      {/* Filtrowanie (Kategorie w poziomie) */}
      <div className="filters">
        <button className="gradient-btn" onClick={() => handleCategoryFilter('')}>Wszystkie</button>
        <button className="gradient-btn" onClick={() => handleCategoryFilter('Materiały')}>Materiały</button>
        <button className="gradient-btn" onClick={() => handleCategoryFilter('Sprzęt')}>Sprzęt</button>
        <button className="gradient-btn" onClick={() => handleCategoryFilter('Środki')}>Środki</button>
      </div>

      {/* Tabela produktów */}
      <table className="product-table">
        <thead>
          <tr>
            <th className="gradient-header">Nazwa produktu</th>
            <th className="gradient-header">Kategoria</th>
            <th className="gradient-header">Poziom zapasów</th>
            <th className="gradient-header">Minimalny poziom zapasów</th>
            <th className="gradient-header">Dodaj do listy zakupów</th> {/* Nowa kolumna */}
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr
              key={product.id}
              className={product.stock < product.minStock ? 'low-stock' : 'sufficient-stock'}
            >
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.stock}</td>
              <td>{product.minStock}</td>
              <td>
                <button 
                  className="gradient-btn" 
                  onClick={() => handleAddToShoppingList(product)}
                >
                  Dodaj
                </button>
              </td> {/* Przycisk dodawania produktu */}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Uzupełnij zapasy */}
      <h3 className="gradient-header">Uzupełnij zapasy</h3>
      <table className="shopping-list-table">
        <thead>
          <tr>
            <th className="gradient-header">Nazwa produktu</th>
            <th className="gradient-header">Ilość</th>
            <th className="gradient-header">Dodane automatycznie</th>
          </tr>
        </thead>
        <tbody>
          {shoppingList.length > 0 ? (
            shoppingList.map((item, index) => (
              <tr
                key={index}
                className={`${item.addedAutomatically ? 'auto-added' : ''}`}
              >
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.addedAutomatically ? 'Automatycznie dodane' : ''}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="3">Brak produktów do dodania</td></tr>
          )}
        </tbody>
      </table>

      {/* Przycisk do uzupełnienia zapasów */}
      <div className="add-all-button">
        <button 
          className="gradient-btn" 
          onClick={addToShoppingList}
        >
          Uzupełnij zapasy
        </button>
      </div>
    </div>
  );
}

export default Inventory;
