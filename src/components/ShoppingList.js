import React, { useState, useEffect } from "react";
import Select from "react-select";
import { saveAs } from "file-saver";
import "./ShoppingList.css";

const ShoppingList = () => {
  const [products, setProducts] = useState(
    JSON.parse(localStorage.getItem("products")) || []
  );
  const [orderHistory, setOrderHistory] = useState(
    JSON.parse(localStorage.getItem("orderHistory")) || []
  );
  const [notes, setNotes] = useState(localStorage.getItem("notes") || "");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [productToAdd, setProductToAdd] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const supplierData = await fetchSuppliersFromAPI();
      setSuppliers(supplierData);
    };

    fetchSuppliers();

    const loadProducts = async () => {
      const fetchedProducts = await fetchProductsFromAPI();
      const sortedProducts = fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));
      const productOptions = sortedProducts.map((product) => ({
        value: product.name,
        label: product.name,
        category: product.category,
        price: product.price,
      }));
      setProductOptions(productOptions);

      const uniqueCategories = [...new Set(fetchedProducts.map((product) => product.category))].sort((a, b) => a.localeCompare(b));
      const categoryOptions = uniqueCategories.map((category) => ({
        value: category,
        label: category,
      }));
      setCategories(categoryOptions);
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

  const fetchProductsFromAPI = async () => {
    try {
      const response = await fetch("/dental_products.json");
      if (!response.ok) {
        throw new Error("Nie udało się załadować danych.");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
      return [];
    }
  };

  const handleSelectProduct = (selectedOption) => {
    setProductToAdd(selectedOption);
  };

  const handleSelectCategory = (selectedOption) => {
    setSelectedCategory(selectedOption);
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
          { 
            name: productToAdd.label, 
            quantity: quantityToAdd, 
            dateAdded: new Date().toLocaleDateString(), 
            price: productToAdd.price || 0,
          },
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
    if (window.confirm("Czy na pewno chcesz usunąć ten produkt?")) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSendOrder = () => {
    if (selectedProviders.length === 0) {
      alert("Wybierz co najmniej jednego dostawcę przed wysłaniem zamówienia!");
      return;
    }
    const providersList = selectedProviders.map((provider) => provider.label).join(", ");
    const orderSummary = {
      date: new Date().toLocaleDateString(),
      products: products,
      totalCost: calculateTotalCost(),
      notes: notes,
      providers: providersList,
    };
    setOrderHistory([...orderHistory, orderSummary]);
    setProducts([]);
    setNotes("");
    alert(`Zamówienie zostało wysłane do: ${providersList}`);
  };

  const calculateTotalCost = () => {
    return products.reduce((total, product) => total + product.quantity * (product.price || 0), 0);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedProducts = [...products].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setProducts(sortedProducts);
  };

  const handleExportCSV = () => {
    const csvContent = products.map(product => `${product.name},${product.quantity},${product.price}`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "lista_zakupow.csv");
  };

  const handleExportPDF = () => {
    alert("Eksport do PDF jest w trakcie implementacji.");
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
  };

  const filteredProductOptions = selectedCategory
    ? productOptions.filter((product) => product.category === selectedCategory.value)
    : productOptions;

  return (
    <div className="shopping-list-container">
      <h2>Lista zakupów</h2>

      {/* Sekcja dodawania produktów */}
      <div className="section">
        <div className="category-product-form">
          <label>Kategoria:</label>
          <Select
            options={categories}
            onChange={handleSelectCategory}
            value={selectedCategory}
            placeholder="Wybierz kategorię"
            className="select-category"
            isClearable
          />
          <label>Produkt:</label>
          <Select
            options={filteredProductOptions}
            onChange={handleSelectProduct}
            value={productToAdd}
            placeholder="Wybierz produkt"
            className="select-product"
          />
          <label>Ilość:</label>
          <input
            type="number"
            min="1"
            value={quantityToAdd}
            onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
            className="quantity-input"
          />
          <button onClick={handleAddProduct} className="add-product-btn">
            <span>+</span> Dodaj produkt
          </button>
        </div>
      </div>

      {/* Sekcja listy produktów */}
      <div className="section">
        <table className="shopping-list">
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
                <td>{product.price || 0} zł</td>
                <td>{product.quantity * (product.price || 0)} zł</td>
                <td>
                  <button className="remove-btn" onClick={() => handleRemoveProduct(index)}>
                    🗑️ Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sekcja łącznego kosztu */}
      <div className="section">
        <div className="total-cost">
          <strong>Łączny koszt zamówienia: {calculateTotalCost()} zł</strong>
        </div>
      </div>

      {/* Sekcja uwag */}
      <div className="section">
        <label>Uwagi:</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="notes-input"
          placeholder="Dodaj uwagi do zamówienia..."
        />
      </div>

      {/* Sekcja dostawców i wysyłania zamówienia */}
      <div className="section">
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
            📤 Wyślij zamówienie
          </button>
        </div>
      </div>

      {/* Sekcja eksportu */}
      <div className="section">
        <div className="export-buttons">
          <button onClick={handleExportCSV} className="export-btn">
            📄 Eksportuj do CSV
          </button>
          <button onClick={handleExportPDF} className="export-btn">
            📄 Eksportuj do PDF
          </button>
        </div>
      </div>

      {/* Sekcja historii zamówień */}
      <div className="section">
        <h3>Historia zamówień</h3>
        <div className="order-history">
          {orderHistory.length === 0 ? (
            <p>Brak historii zamówień</p>
          ) : (
            <>
              <div className="order-history-headers">
                <span><strong>Data zamówienia</strong></span>
                <span><strong>Łączny koszt</strong></span>
                <span><strong>Dostawca</strong></span>
                <span><strong>Akcje</strong></span>
              </div>
              {orderHistory.map((order, index) => (
                <div key={index} className="order-history-item" onClick={() => handleViewOrderDetails(order)}>
                  <span>{order.date}</span>
                  <span>{order.totalCost} zł</span>
                  <span>{order.providers}</span>
                  <span className="view-details-icon">🔍 Podgląd</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal z szczegółami zamówienia */}
      {selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-content">
            <h3>Szczegóły zamówienia z dnia {selectedOrder.date}</h3>
            <p><strong>Wysłane do:</strong> {selectedOrder.providers}</p>
            <p><strong>Uwagi:</strong> {selectedOrder.notes}</p>
            <table>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Ilość</th>
                  <th>Cena (szt.)</th>
                  <th>Łączna cena</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.quantity} szt.</td>
                    <td>{product.price || 0} zł</td>
                    <td>{product.quantity * (product.price || 0)} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleCloseOrderDetails} className="close-modal-btn">
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;