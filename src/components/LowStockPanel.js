import React, { useState, useEffect } from "react";
import "./LowStockPanel.css"; // Stylizacja zgodna z nową kolorystyką

const LowStockPanel = ({ products }) => {
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    if (products) {
      const filtered = products.filter((product) => product.stock < product.minStock);
      setLowStockItems(filtered.slice(0, 5)); // Pokaż tylko 5 produktów
    }
  }, [products]);

  return (
    <div className="low-stock-panel">
      <h3>📉 Produkty poniżej minimalnego poziomu</h3>
      <ul>
        {lowStockItems.length > 0 ? (
          lowStockItems.map((item) => (
            <li key={item.id} onClick={() => console.log(`Przejdź do zamówienia: ${item.name}`)}>
              <span className="product-name">{item.name}</span>
              <span className="stock-status">({item.stock} szt.)</span>
            </li>
          ))
        ) : (
          <p>✅ Wszystkie produkty są na odpowiednim poziomie!</p>
        )}
      </ul>
    </div>
  );
};

export default LowStockPanel;
