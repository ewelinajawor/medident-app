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

  const handleDeleteOrder = (index) => {
    if (window.confirm("Czy na pewno chcesz usunąć to zamówienie?")) {
      const updatedOrderHistory = orderHistory.filter((_, i) => i !== index);
      setOrderHistory(updatedOrderHistory);
    }
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
  };

  const filteredProductOptions = selectedCategory
    ? productOptions.filter((product) => product.category === selectedCategory.value)
    : productOptions;

  return (
    <div className="shopping-list-container">
      <h2 className="welcome-message">Lista zakupów</h2>

      {/* Sekcja dodawania produktów */}
      <div className="section">
        <div className="category-product-form">
          <div className="form-group">
            <label>Kategoria:</label>
            <Select
              options={categories}
              onChange={handleSelectCategory}
              value={selectedCategory}
              placeholder="Wybierz kategorię"
              className="select-category"
              isClearable
            />
          </div>
          <div className="form-group">
            <label>Produkt:</label>
            <Select
              options={filteredProductOptions}
              onChange={handleSelectProduct}
              value={productToAdd}
              placeholder="Wybierz produkt"
              className="select-product"
            />
          </div>
          <div className="form-group">
            <label>Ilość:</label>
            <input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
              className="quantity-input"
            />
          </div>
          <div className="form-group">
            <button onClick={handleAddProduct} className="add-product-button">
              <span>+</span> Dodaj
            </button>
          </div>
        </div>
      </div>

      {/* Sekcja listy produktów */}
      <div className="section">
        <table className="shopping-list">
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Ilość</th>
              <th>Data dodania</th>
              <th>Cena (szt.)</th>
              <th>Łączna cena</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {products
              .sort((a, b) => a.name.localeCompare(b.name)) /* Sortowanie produktów */
              .map((product, index) => (
                <tr key={index} className="product-item">
                  <td>
                    <div className="product-name" title={product.name}>
                      {product.name}
                    </div>
                  </td>
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
                      <span>🗑️</span> Usuń
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
          <div className="provider-select-container">
            <label>Dostawca:</label>
            <Select
              options={suppliers}
              isMulti
              onChange={handleSelectProviders}
              value={selectedProviders}
              placeholder="Wybierz dostawcę"
              className="select-provider"
            />
          </div>
          <div>
            <button onClick={handleSendOrder} className="tile-button">
              <span>📤</span> Wyślij zamówienie
            </button>
          </div>
        </div>
      </div>

      {/* Sekcja eksportu */}
      <div className="section">
        <div className="export-buttons">
          <button onClick={handleExportCSV} className="quick-action-button">
            <span>📄</span> Eksportuj do CSV
          </button>
          <button onClick={handleExportPDF} className="quick-action-button">
            <span>📄</span> Eksportuj do PDF
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
                <div
                  key={index}
                  className="order-history-item"
                  onClick={() => handleRowClick(order)}
                >
                  <span>{order.date}</span>
                  <span>{order.totalCost} zł</span>
                  <span>{order.providers}</span>
                  <div className="order-actions">
                    <button
                      className="view-details-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOrderDetails(order);
                      }}
                    >
                      <span>🔍</span> Podgląd
                    </button>
                    <button
                      className="delete-order-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(index);
                      }}
                    >
                      <span>🗑️</span> Usuń
                    </button>
                  </div>
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