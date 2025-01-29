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
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    return 0;
  });

  // Filtrowanie po kategorii
  const filteredProducts = sortedProducts.filter((product) => {
    if (!filterCategory) return true;
    return product.category === filterCategory;
  });

  // Funkcja zmieniająca sortowanie
  const handleSort = (field) => {
    setSortBy((prevSortBy) => (prevSortBy === field ? '' : field));
  };

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

      {/* Tabela produktów */}
      <table className="product-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>
              Nazwa produktu
              {sortBy === 'name' && <span className={`sort-arrow ${sortBy === 'name' ? 'asc' : ''}`}></span>}
            </th>
            <th onClick={() => handleSort('category')}>
              Kategoria
              {sortBy === 'category' && <span className={`sort-arrow ${sortBy === 'category' ? 'asc' : ''}`}></span>}
            </th>
            <th onClick={() => handleSort('stock')}>
              Poziom zapasów
              {sortBy === 'stock' && <span className={`sort-arrow ${sortBy === 'stock' ? 'asc' : ''}`}></span>}
            </th>
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
              <td>{product.category}</td>
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
