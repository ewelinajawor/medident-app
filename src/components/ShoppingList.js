import React, { useState, useEffect } from "react";
import Select from "react-select";
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
  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const supplierData = await fetchSuppliersFromAPI();
      setSuppliers(supplierData);
    };

    fetchSuppliers();

    const loadProducts = async () => {
      const fetchedProducts = await fetchProductsFromAPI();
      setProductOptions(fetchedProducts.map(product => ({
        value: product.name, label: product.name
      })));
    };

    loadProducts();
  }, []);

  const fetchSuppliersFromAPI = () => {
    return [
      { value: "Koldental", label: "Koldental" },
      { value: "Meditrans", label: "Meditrans" },
      { value: "Marrodent", label: "Marrodent" },
    ];
  };

  const fetchProductsFromAPI = () => {
    return [
      { name: "Wypełnienie", quantity: 10 },
      { name: "Dezynfekcja", quantity: 15 },
      { name: "Wiertła stomatologiczne", quantity: 20 },
      { name: "Szczoteczki międzyzębowe", quantity: 25 },
      { name: "Strzykawki do wypełnień", quantity: 30 },
      { name: "Materiały kompozytowe", quantity: 35 },
    ];
  };

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

  // Funkcja do obliczania całkowitej ilości produktów
  const calculateTotalQuantity = () => {
    return products.reduce((total, product) => total + product.quantity, 0);
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
          onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
          className="quantity-input"
        />
        <button onClick={handleAddProduct} className="add-product-btn">
          Dodaj produkt
        </button>
      </div>

      {/* Tabela produktów */}
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
              <td className="quantity-column">
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

      {/* Podsumowanie zamówienia */}
      <div className="order-summary">
        <h3>Podsumowanie zamówienia</h3>
        <div className="order-summary-list">
          {products.map((product, index) => (
            <div key={index} className="order-summary-item">
              <span className="product-name">{product.name}</span>
              <span className="product-quantity">
                {" - "} {product.quantity} szt.
              </span>
            </div>
          ))}
        </div>
        <div className="total-quantity">
          <strong>Łączna ilość produktów: {calculateTotalQuantity()} szt.</strong>
        </div>
      </div>

      {/* Formularz dostawców */}
      <div className="provider-form">
        <Select
          options={suppliers}
          isMulti
          onChange={handleSelectProviders}
          value={selectedProviders}
          placeholder="Wybierz dostawcę"
          className="select-provider"
        />
        <button onClick={handleSendOrder} className="send-order-btn">
          Wyślij zamówienie
        </button>
      </div>
    </div>
  );
};

export default ShoppingList;
