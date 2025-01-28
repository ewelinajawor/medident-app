import React, { useState } from 'react';
import './Inventory.css';

function Inventory() {
  const [sortBy, setSortBy] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const products = [
    { name: 'Wypełnienie', stock: 10, minStock: 5, category: 'Materiały' },
    { name: 'Dezynfekcja', stock: 3, minStock: 5, category: 'Środki' },
    { name: 'Szczoteczki', stock: 1, minStock: 5, category: 'Sprzęt' },
    { name: 'Rękawiczki', stock: 8, minStock: 5, category: 'Środki' },
  ];

  // Sortowanie produktów
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'stock') return a.stock - b.stock;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  // Filtrowanie po kategorii
  const filteredProducts = sortedProducts.filter((product) => {
    if (!filterCategory) return true;
    return product.category === filterCategory;
  });

  return (
    <div className="inventory">
      <h2>Zarządzanie zapasami</h2>

      {/* Filtrowanie */}
      <div className="filters">
        <button onClick={() => setFilterCategory('')}>Wszystkie</button>
        <button onClick={() => setFilterCategory('Materiały')}>Materiały</button>
        <button onClick={() => setFilterCategory('Środki')}>Środki</button>
        <button onClick={() => setFilterCategory('Sprzęt')}>Sprzęt</button>
      </div>

      {/* Sortowanie */}
      <div className="sort-options">
        <button onClick={() => setSortBy('name')}>Sortuj alfabetycznie</button>
        <button onClick={() => setSortBy('stock')}>Sortuj według zapasów</button>
      </div>

      {/* Tabela produktów */}
      <table className="product-table">
        <thead>
          <tr>
            <th>Nazwa produktu</th>
            <th>Aktualny poziom zapasów</th>
            <th>Minimalny poziom zapasów</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product, index) => (
            <tr
              key={index}
              className={product.stock <= product.minStock ? 'low-stock' : 'sufficient-stock'}
            >
              <td>{product.name}</td>
              <td>{product.stock}</td>
              <td>{product.minStock}</td>
              <td>
                <button>Dodaj do listy zakupów</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Przyciski */}
      <button className="add-product-btn">Dodaj nowy produkt</button>
    </div>
  );
}

export default Inventory;
