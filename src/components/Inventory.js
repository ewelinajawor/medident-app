import React, { useState, useEffect } from 'react';
import './Inventory.css';
import Footer from './Footer';

function Inventory() {
  const [shoppingList, setShoppingList] = useState([]);
  const [products, setProducts] = useState([
    { id: 1, name: 'Masa wyciskowa', category: 'Materiały', stock: 10, minStock: 5 },
    { id: 2, name: 'Narzędzia protetyczne', category: 'Sprzęt', stock: 3, minStock: 5 },
    { id: 3, name: 'Żel do wycisków', category: 'Materiały', stock: 8, minStock: 4 },
    { id: 4, name: 'Środek do czyszczenia', category: 'Środki', stock: 15, minStock: 10 },
    { id: 5, name: 'Nożyczki chirurgiczne', category: 'Sprzęt', stock: 2, minStock: 5 },
  ]);

  const addToShoppingList = (product, quantity) => {
    if (quantity <= 0 || isNaN(quantity)) return;

    const existingProductIndex = shoppingList.findIndex(item => item.name === product.name);

    if (existingProductIndex !== -1) {
      const updatedShoppingList = [...shoppingList];
      updatedShoppingList[existingProductIndex].quantity += quantity;
      updatedShoppingList[existingProductIndex].dateAdded = new Date().toLocaleString();
      setShoppingList(updatedShoppingList);
    } else {
      setShoppingList([
        ...shoppingList,
        { ...product, quantity, dateAdded: new Date().toLocaleString() }
      ]);
    }
  };

  useEffect(() => {
    products.forEach(product => {
      if (product.stock <= product.minStock) {
        addToShoppingList(product, product.minStock - product.stock);
      }
    });
  }, [products]);

  return (
    <div className="inventory">
      <h2>Zarządzanie zapasami</h2>

      {/* Filtrowanie */}
      <div className="filters">
        <button>Wszystkie</button>
        <button>Materiały</button>
        <button>Sprzęt</button>
        <button>Środki</button>
      </div>

      {/* Tabela produktów */}
      <table className="product-table">
        <thead>
          <tr>
            <th>Nazwa produktu</th>
            <th>Kategoria</th>
            <th>Poziom zapasów</th>
            <th>Minimalny poziom zapasów</th>
            <th>Ilość do dodania</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className={product.stock <= product.minStock ? 'low-stock' : 'sufficient-stock'}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.stock}</td>
              <td>{product.minStock}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  defaultValue={1}
                  id={`quantity-input-${product.id}`}
                  placeholder="Wpisz ilość"
                />
              </td>
              <td>
                <button
                  className="add-to-list-btn"
                  onClick={() => {
                    const quantity = parseInt(document.getElementById(`quantity-input-${product.id}`).value);
                    addToShoppingList(product, quantity);
                  }}
                >
                  Dodaj do listy zakupów
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Lista zakupów jako tabela */}
      <h3>Lista zakupów</h3>
      <table className="shopping-list-table">
        <thead>
          <tr>
            <th>Nazwa produktu</th>
            <th>Ilość</th>
            <th>Data dodania</th>
          </tr>
        </thead>
        <tbody>
          {shoppingList.length > 0 ? (
            shoppingList.map((item, index) => (
              <tr
                key={index}
                className={item.quantity <= 0 ? 'low-stock' : 'sufficient-stock'}
              >
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.dateAdded}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">Brak produktów na liście zakupów.</td>
            </tr>
          )}
        </tbody>
      </table>

      <button className="create-btn">Utwórz</button>

      <Footer />
    </div>
  );
}

export default Inventory;
