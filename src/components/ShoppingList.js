import React, { useState } from "react";
import Select from "react-select";
import "./ShoppingList.css";

const ShoppingList = () => {
  const [products, setProducts] = useState([
    { name: "Wypełnienie", quantity: 1 },
    { name: "Dezynfekcja", quantity: 2 },
    { name: "Wiertła stomatologiczne", quantity: 1 },
    { name: "Szczoteczki międzyzębowe", quantity: 5 },
    { name: "Strzykawki do wypełnień", quantity: 2 },
    { name: "Materiały kompozytowe", quantity: 3 },
  ]);

  const [productToAdd, setProductToAdd] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  // Lista produktów do rozwijanej listy
  const productOptions = [
    { value: "Wypełnienie", label: "Wypełnienie" },
    { value: "Dezynfekcja", label: "Dezynfekcja" },
    { value: "Wiertła stomatologiczne", label: "Wiertła stomatologiczne" },
    { value: "Szczoteczki międzyzębowe", label: "Szczoteczki międzyzębowe" },
    { value: "Strzykawki do wypełnień", label: "Strzykawki do wypełnień" },
    { value: "Materiały kompozytowe", label: "Materiały kompozytowe" },
  ];

  const handleSelectProduct = (selectedOption) => {
    setProductToAdd(selectedOption);
  };

  const handleAddProduct = () => {
    if (productToAdd && quantityToAdd >= 1) {
      setProducts([
        ...products,
        { name: productToAdd.label, quantity: quantityToAdd },
      ]);
      setProductToAdd(null);
      setQuantityToAdd(1);
    }
  };

  const handleRemoveProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  return (
    <div className="shopping-list-container">
      <h2>Lista zakupów</h2>

      <div className="product-form">
        <Select
          options={productOptions}
          onChange={handleSelectProduct}
          value={productToAdd}
          placeholder="Wybierz produkt"
        />
        <input
          type="number"
          min="1"
          value={quantityToAdd}
          onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value)))}
        />
        <button className="add-product-btn" onClick={handleAddProduct}>
          Dodaj produkt
        </button>
      </div>

      <table className="shopping-list">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Ilość</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index} className="product-item">
              <td>{product.name}</td>
              <td>{product.quantity} szt.</td>
              <td>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveProduct(index)}
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="action-buttons">
        <button className="send-order-btn">Wyślij zamówienie</button>
      </div>
    </div>
  );
};

export default ShoppingList;
