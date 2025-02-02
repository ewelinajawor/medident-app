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
  const [selectedProviders, setSelectedProviders] = useState([]); // Tablica dostawców

  const productOptions = [
    { value: "Wypełnienie", label: "Wypełnienie" },
    { value: "Dezynfekcja", label: "Dezynfekcja" },
    { value: "Wiertła stomatologiczne", label: "Wiertła stomatologiczne" },
    { value: "Szczoteczki międzyzębowe", label: "Szczoteczki międzyzębowe" },
    { value: "Strzykawki do wypełnień", label: "Strzykawki do wypełnień" },
    { value: "Materiały kompozytowe", label: "Materiały kompozytowe" },
  ];

  const providerOptions = [
    { value: "Dostawca 1", label: "Dostawca 1" },
    { value: "Dostawca 2", label: "Dostawca 2" },
    { value: "Dostawca 3", label: "Dostawca 3" },
  ];

  const handleSelectProduct = (selectedOption) => {
    setProductToAdd(selectedOption);
  };

  const handleSelectProviders = (selectedOptions) => {
    setSelectedProviders(selectedOptions || []); // Obsługuje wiele dostawców
  };

  const handleAddProduct = () => {
    if (productToAdd && quantityToAdd >= 1) {
      const existingProductIndex = products.findIndex(
        (product) => product.name === productToAdd.label
      );

      if (existingProductIndex !== -1) {
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex].quantity += quantityToAdd;
        setProducts(updatedProducts);
      } else {
        setProducts([
          ...products,
          { name: productToAdd.label, quantity: quantityToAdd },
        ]);
      }

      setProductToAdd(null);
      setQuantityToAdd(1);
    } else {
      alert("Wybierz produkt i wprowadź poprawną ilość.");
    }
  };

  const handleRemoveProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
    setProductToAdd(null);
    setQuantityToAdd(1);
  };

  const handleSendOrder = () => {
    if (selectedProviders.length === 0) {
      alert("Wybierz co najmniej jednego dostawcę przed wysłaniem zamówienia!");
      return;
    }

    // Listowanie wybranych dostawców
    const providersList = selectedProviders.map(provider => provider.label).join(", ");
    alert(`Zamówienie zostało wysłane do: ${providersList}`);
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
          placeholder="Ilość"
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

      <div className="provider-selection">
        <Select
          options={providerOptions}
          onChange={handleSelectProviders}
          value={selectedProviders}
          isMulti // Włączenie wielokrotnego wyboru
          placeholder="Wybierz dostawców"
        />
      </div>

      <div className="action-buttons">
        <button className="send-order-btn" onClick={handleSendOrder}>
          Wyślij zamówienie
        </button>
      </div>
    </div>
  );
};

export default ShoppingList;
