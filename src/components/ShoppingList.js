import React, { useState, useEffect } from "react";
import Select from "react-select";
import Suppliers from "./Suppliers"; // Importowanie komponentu dostawców
import "./ShoppingList.css";

const ShoppingList = () => {
  const [products, setProducts] = useState([
    { name: "Wypełnienie", quantity: 1, dateAdded: new Date().toLocaleDateString() },
    { name: "Dezynfekcja", quantity: 2, dateAdded: new Date().toLocaleDateString() },
    { name: "Wiertła stomatologiczne", quantity: 1, dateAdded: new Date().toLocaleDateString() },
    { name: "Szczoteczki międzyzębowe", quantity: 5, dateAdded: new Date().toLocaleDateString() },
    { name: "Strzykawki do wypełnień", quantity: 2, dateAdded: new Date().toLocaleDateString() },
    { name: "Materiały kompozytowe", quantity: 3, dateAdded: new Date().toLocaleDateString() },
  ]);

  const [productToAdd, setProductToAdd] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    // Zakładając, że Supplier.js będzie przekazywać dane dostawców przez props onSuppliersLoaded
    const fetchSuppliers = async () => {
      const supplierData = await fetchSuppliersFromAPI();
      setSuppliers(supplierData);
    };

    fetchSuppliers();
  }, []);

  // Funkcja do pobierania danych dostawców z pliku Suppliers.js
  const fetchSuppliersFromAPI = () => {
    // Tu symulujemy pobieranie danych. Możesz to zmienić na fetch z prawdziwego API.
    return [
      { value: "Koldental", label: "Koldental" },
      { value: "Meditrans", label: "Meditrans" },
      { value: "Marrodent", label: "Marrodent" },
    ];
  };

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

  const handleSelectProviders = (selectedOptions) => {
    setSelectedProviders(selectedOptions || []);
  };

  const handleAddProduct = () => {
    if (productToAdd && quantityToAdd >= 1) {
      const existingProductIndex = products.findIndex(
        (product) => product.name === productToAdd.label
      );

      if (existingProductIndex !== -1) {
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex].quantity += quantityToAdd;
        updatedProducts[existingProductIndex].dateAdded = new Date().toLocaleDateString();
        setProducts(updatedProducts);
      } else {
        setProducts([
          ...products,
          { name: productToAdd.label, quantity: quantityToAdd, dateAdded: new Date().toLocaleDateString() },
        ]);
      }

      setProductToAdd(null);
      setQuantityToAdd(1);
    } else {
      alert("Wybierz produkt i wprowadź poprawną ilość.");
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity >= 1) {
      setProducts((prevProducts) =>
        prevProducts.map((product, i) =>
          i === index ? { ...product, quantity: newQuantity } : product
        )
      );
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
    const providersList = selectedProviders.map((provider) => provider.label).join(", ");
    alert(`Zamówienie zostało wysłane do: ${providersList}`);
  };

  return (
    <div className="shopping-list-container">
      <h2>Lista zakupów</h2>

      {/* Formularz dodawania produktu */}
      <div className="product-form">
        <Select
          options={productOptions}
          onChange={handleSelectProduct}
          value={productToAdd}
          placeholder="Wybierz produkt"
          className="select-product"
        />
        <input
          type="number"
          min="1"
          value={quantityToAdd}
          onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value)))}
          placeholder="Ilość"
          className="quantity-input"
        />
        <button className="add-product-btn" onClick={handleAddProduct}>
          Dodaj produkt
        </button>
      </div>

      {/* Tabela z produktami */}
      <table className="shopping-list">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Ilość</th>
            <th>Data dodania</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index} className="product-item">
              <td>{product.name}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={product.quantity}
                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                  className="quantity-edit"
                />
              </td>
              <td>{product.dateAdded}</td>
              <td>
                <button className="remove-btn" onClick={() => handleRemoveProduct(index)}>
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sekcja z wyborem dostawców */}
      <div className="provider-form">
        <Select
          isMulti
          options={suppliers}
          onChange={handleSelectProviders}
          value={selectedProviders}
          placeholder="Wybierz dostawców"
          className="select-provider"
        />
      </div>

      {/* Przycisk wysyłania zamówienia */}
      <button className="send-order-btn" onClick={handleSendOrder}>
        Wyślij zamówienie
      </button>

      {/* Podgląd listy zakupów */}
      <div className="order-summary">
        <h3>Podsumowanie zamówienia</h3>
        <ul>
          {products.map((product, index) => (
            <li key={index}>
              {product.name} - {product.quantity} szt. (Dodano: {product.dateAdded})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ShoppingList;
