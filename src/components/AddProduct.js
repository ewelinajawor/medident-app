import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Importujemy useNavigate

const ProductList = () => {
  const [products, setProducts] = useState([]);
  
  // Używamy useNavigate do nawigacji
  const navigate = useNavigate();

  useEffect(() => {
    // Tutaj możesz załadować produkty z API lub innego źródła
    setProducts([
      { id: 1, name: "Produkt 1", price: 100 },
      { id: 2, name: "Produkt 2", price: 150 },
      { id: 3, name: "Produkt 3", price: 200 },
    ]);
  }, []);

  const handleProductClick = (productId) => {
    // Przykładowa logika nawigacji do strony produktu
    navigate(`/product/${productId}`);
  };

  return (
    <div className="product-list">
      <h2>Lista Produktów</h2>
      <ul>
        {products.map(product => (
          <li key={product.id} onClick={() => handleProductClick(product.id)}>
            {product.name} - {product.price} PLN
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
