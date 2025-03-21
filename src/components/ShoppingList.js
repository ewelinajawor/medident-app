import React, { useState, useEffect } from "react";
import Select from "react-select";
import { saveAs } from "file-saver";
import "./ShoppingList.css";

const ShoppingList = () => {
  // Stany komponentu
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
  
  // Nowe stany
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showLowStockProducts, setShowLowStockProducts] = useState(false);

  // Efekty zapisujące dane do localStorage
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  // Efekt pobierający dane z API
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
        minStock: product.minStock || 5,
        currentStock: product.currentStock || 0
      }));
      setProductOptions(productOptions);

      // Znajdź produkty z niskim stanem magazynowym
      const lowStock = sortedProducts.filter(product => 
        (product.currentStock || 0) < (product.minStock || 5)
      );
      setLowStockProducts(lowStock);

      const uniqueCategories = [...new Set(fetchedProducts.map((product) => product.category))].sort((a, b) => a.localeCompare(b));
      const categoryOptions = uniqueCategories.map((category) => ({
        value: category,
        label: category,
      }));
      setCategories(categoryOptions);
    };

    loadProducts();
  }, []);

  // Funkcje pobierające dane
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

  // Funkcje obsługi formularza
  const handleSelectProduct = (selectedOption) => {
    setProductToAdd(selectedOption);
    // Automatycznie ustaw ilość na brakującą ilość, jeśli produkt ma niski stan
    if (selectedOption) {
      const stockDifference = selectedOption.minStock - selectedOption.currentStock;
      if (stockDifference > 0) {
        setQuantityToAdd(stockDifference);
      } else {
        setQuantityToAdd(1);
      }
    }
  };

  const handleSelectCategory = (selectedOption) => {
    setSelectedCategory(selectedOption);
    setProductToAdd(null); // Reset wybranego produktu przy zmianie kategorii
  };

  const handleSelectProviders = (selectedOptions) => {
    setSelectedProviders(selectedOptions || []);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
            category: productToAdd.category
          },
        ]);
      }

      // Pokaż komunikat sukcesu
      setSuccessMessage(`Dodano ${quantityToAdd} szt. "${productToAdd.label}" do listy zakupów`);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);

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
    if (products.length === 0) {
      alert("Nie możesz wysłać pustego zamówienia. Dodaj produkty do listy zakupów.");
      return;
    }
    
    if (selectedProviders.length === 0) {
      alert("Wybierz co najmniej jednego dostawcę przed wysłaniem zamówienia!");
      return;
    }

    setIsOrderModalOpen(true);
  };

  const confirmSendOrder = () => {
    const providersList = selectedProviders.map((provider) => provider.label).join(", ");
    const orderSummary = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      products: products,
      totalCost: calculateTotalCost(),
      notes: notes,
      providers: providersList,
    };
    setOrderHistory([...orderHistory, orderSummary]);
    setProducts([]);
    setNotes("");
    setIsOrderModalOpen(false);
    
    // Pokaż komunikat sukcesu
    setSuccessMessage(`Zamówienie zostało wysłane do: ${providersList}`);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const cancelSendOrder = () => {
    setIsOrderModalOpen(false);
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
    // Nagłówki CSV
    const headers = "Nazwa,Kategoria,Ilość,Cena jednostkowa,Łączna cena\n";
    
    // Dane produktów
    const csvContent = headers + products.map(
      product => `"${product.name}","${product.category || ""}",${product.quantity},${product.price},${product.quantity * (product.price || 0)}`
    ).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `lista_zakupow_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`);
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
    if (window.confirm("Czy na pewno chcesz usunąć to zamówienie z historii?")) {
      const updatedOrderHistory = orderHistory.filter((_, i) => i !== index);
      setOrderHistory(updatedOrderHistory);
    }
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
  };

  const handleAddLowStockToList = () => {
    if (lowStockProducts.length === 0) {
      alert("Nie ma produktów z niskim stanem magazynowym.");
      return;
    }

    // Dodaj wszystkie produkty z niskim stanem do listy zakupów
    lowStockProducts.forEach(product => {
      const stockDifference = product.minStock - product.currentStock;
      const quantityToOrder = stockDifference > 0 ? stockDifference : 1;

      const existingProductIndex = products.findIndex(p => p.name === product.name);

      if (existingProductIndex !== -1) {
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex].quantity += quantityToOrder;
        setProducts(updatedProducts);
      } else {
        setProducts(prevProducts => [
          ...prevProducts,
          {
            name: product.name,
            quantity: quantityToOrder,
            dateAdded: new Date().toLocaleDateString(),
            price: product.price || 0,
            category: product.category
          }
        ]);
      }
    });

    setSuccessMessage(`Dodano ${lowStockProducts.length} produktów z niskim stanem do listy zakupów`);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
    setShowLowStockProducts(false);
  };

  const handleAddProductFromHistory = (product) => {
    const existingProductIndex = products.findIndex(p => p.name === product.name);

    if (existingProductIndex !== -1) {
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex].quantity += product.quantity;
      setProducts(updatedProducts);
    } else {
      setProducts([
        ...products,
        {
          ...product,
          dateAdded: new Date().toLocaleDateString()
        }
      ]);
    }

    setSuccessMessage(`Dodano "${product.name}" do listy zakupów`);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  // Filtrowanie produktów
  const filteredProductOptions = productOptions
    .filter(product => {
      // Filtruj po kategorii
      const matchesCategory = selectedCategory
        ? product.category === selectedCategory.value
        : true;
      
      // Filtruj po wyszukiwaniu
      const matchesSearch = searchQuery
        ? product.label.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
        
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  // Filtruj produkty na liście zakupów
  const filteredShoppingList = products.filter(product => {
    return product.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="shopping-list-container">
      <h2 className="welcome-message">Lista zakupów</h2>

      {/* Alert sukcesu */}
      {showSuccessAlert && (
        <div className="success-alert">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      {/* Podsumowanie (widoczne tylko gdy są produkty) */}
      {products.length > 0 && (
        <div className="summary-panel">
          <div className="summary-item">
            <span>Liczba produktów:</span>
            <strong>{products.length}</strong>
          </div>
          <div className="summary-item">
            <span>Łączna wartość:</span>
            <strong>{calculateTotalCost().toFixed(2)} zł</strong>
          </div>
        </div>
      )}

      {/* Szybkie akcje */}
      <div className="quick-actions">
        <button
          className="quick-action-button"
          onClick={() => setShowLowStockProducts(!showLowStockProducts)}
        >
          🔍 Produkty z niskim stanem ({lowStockProducts.length})
        </button>
        <button onClick={handleExportCSV} className="quick-action-button">
          📄 Eksportuj listę
        </button>
      </div>

      {/* Panel produktów z niskim stanem (widoczny po kliknięciu) */}
      {showLowStockProducts && lowStockProducts.length > 0 && (
        <div className="low-stock-panel">
          <div className="low-stock-header">
            <h3>Produkty z niskim stanem magazynowym</h3>
            <button className="add-all-button" onClick={handleAddLowStockToList}>
              Dodaj wszystkie do listy
            </button>
          </div>
          <table className="low-stock-table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Kategoria</th>
                <th>Stan</th>
                <th>Min. stan</th>
                <th>Brakuje</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product, index) => {
                const shortage = product.minStock - product.currentStock;
                return (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td className="critical-stock">{product.currentStock}</td>
                    <td>{product.minStock}</td>
                    <td>{shortage > 0 ? shortage : 0}</td>
                    <td>
                      <button
                        className="add-to-list-btn"
                        onClick={() => {
                          const existingProductIndex = products.findIndex(p => p.name === product.name);
                          if (existingProductIndex !== -1) {
                            const updatedProducts = [...products];
                            updatedProducts[existingProductIndex].quantity += shortage > 0 ? shortage : 1;
                            setProducts(updatedProducts);
                          } else {
                            setProducts([
                              ...products,
                              {
                                name: product.name,
                                quantity: shortage > 0 ? shortage : 1,
                                dateAdded: new Date().toLocaleDateString(),
                                price: product.price || 0,
                                category: product.category
                              }
                            ]);
                          }
                          setSuccessMessage(`Dodano "${product.name}" do listy zakupów`);
                          setShowSuccessAlert(true);
                          setTimeout(() => setShowSuccessAlert(false), 3000);
                        }}
                      >
                        + Dodaj do listy
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sekcja wyszukiwania */}
      <div className="section search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Szukaj produktów..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* Sekcja dodawania produktów */}
      <div className="section add-product-section">
        <h3 className="section-title">Dodaj produkt do listy</h3>
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
              styles={{
                control: (provided) => ({
                  ...provided,
                  width: "100%",
                }),
              }}
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
              isSearchable
              noOptionsMessage={() => "Brak produktów spełniających kryteria"}
            />
          </div>
          <div className="form-group">
            <label>Ilość:</label>
            <input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
              className="quantity-input"
            />
          </div>
          <button onClick={handleAddProduct} className="add-product-button">
            <span>+</span> Dodaj do listy
          </button>
        </div>
      </div>

      {/* Sekcja listy produktów */}
      <div className="section products-section">
        <h3 className="section-title">
          Lista produktów {products.length > 0 ? `(${products.length})` : ""}
        </h3>
        {products.length === 0 ? (
          <div className="empty-list">
            <p>Twoja lista zakupów jest pusta</p>
            <p>Użyj formularza powyżej, aby dodać produkty do listy</p>
          </div>
        ) : (
          <table className="shopping-list">
            <thead>
              <tr>
                <th style={{ width: "35%" }} onClick={() => handleSort('name')}>
                  Nazwa {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                </th>
                <th style={{ width: "15%" }}>Kategoria</th>
                <th style={{ width: "10%" }}>Ilość</th>
                <th style={{ width: "15%" }}>Cena (szt.)</th>
                <th style={{ width: "15%" }}>Łączna cena</th>
                <th style={{ width: "10%" }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredShoppingList.map((product, index) => (
                <tr key={index} className="product-item">
                  <td>{product.name}</td>
                  <td>{product.category || "-"}</td>
                  <td className="quantity-column">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn" 
                        onClick={() => handleQuantityChange(index, Math.max(1, product.quantity - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="quantity-edit"
                      />
                      <button 
                        className="quantity-btn" 
                        onClick={() => handleQuantityChange(index, product.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{product.price ? `${product.price.toFixed(2)} zł` : "0.00 zł"}</td>
                  <td><strong>{product.quantity * (product.price || 0)} zł</strong></td>
                  <td>
                    <button className="remove-btn" onClick={() => handleRemoveProduct(index)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="4" className="total-label">Łączny koszt zamówienia:</td>
                <td colSpan="2" className="total-value">{calculateTotalCost().toFixed(2)} zł</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Sekcja uwag */}
      <div className="section notes-section">
        <h3 className="section-title">Uwagi do zamówienia</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="notes-input"
          placeholder="Dodaj uwagi do zamówienia (np. termin dostawy, sposób płatności)..."
          rows="3"
        />
      </div>

      {/* Sekcja dostawców i wysyłania zamówienia */}
      <div className="section order-section">
        <h3 className="section-title">Wyślij zamówienie</h3>
        <div className="provider-form">
          <div className="provider-select-container">
            <label>Wybierz dostawcę:</label>
            <Select
              options={suppliers}
              isMulti
              onChange={handleSelectProviders}
              value={selectedProviders}
              placeholder="Wybierz dostawcę"
              className="select-provider"
              styles={{
                control: (provided) => ({
                  ...provided,
                  width: "100%",
                  minWidth: "300px",
                }),
              }}
            />
          </div>
          <button 
            onClick={handleSendOrder} 
            className="send-order-button"
            disabled={products.length === 0}
          >
            📤 Wyślij zamówienie
          </button>
        </div>
      </div>

      {/* Sekcja historii zamówień */}
      <div className="section history-section">
        <h3 className="section-title">Historia zamówień</h3>
        <div className="order-history">
          {orderHistory.length === 0 ? (
            <div className="empty-history">
              <p>Brak historii zamówień</p>
              <p>Tu będą widoczne Twoje poprzednie zamówienia</p>
            </div>
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
                  <span>{order.date} {order.time || ""}</span>
                  <span>{order.totalCost.toFixed(2)} zł</span>
                  <span>{order.providers}</span>
                  <div className="order-actions">
                    <button
                      className="view-details-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOrderDetails(order);
                      }}
                    >
                      🔍
                    </button>
                    <button
                      className="delete-order-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(index);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal potwierdżenia wysłania zamówienia */}
      {isOrderModalOpen && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Potwierdzenie zamówienia</h3>
            <p>Zamierzasz wysłać zamówienie do następujących dostawców:</p>
            <p className="suppliers-list">
              {selectedProviders.map(provider => provider.label).join(", ")}
            </p>
            <p>Łączna wartość: <strong>{calculateTotalCost().toFixed(2)} zł</strong></p>
            <p>Liczba produktów: <strong>{products.length}</strong></p>

            <div className="confirmation-buttons">
              <button onClick={confirmSendOrder} className="confirm-button">
                Wyślij zamówienie
              </button>
              <button onClick={cancelSendOrder} className="cancel-button">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal z szczegółami zamówienia */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="order-details-modal">
            <div className="modal-header">
              <h3>Szczegóły zamówienia z dnia {selectedOrder.date}</h3>
              <button onClick={handleCloseOrderDetails} className="close-modal-btn">
                ✕
              </button>
            </div>
            <div className="order-details-content">
              <div className="order-info">
                <p><strong>Wysłane do:</strong> {selectedOrder.providers}</p>
                {selectedOrder.notes && <p><strong>Uwagi:</strong> {selectedOrder.notes}</p>}
              </div>
              <table className="order-details-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>Kategoria</th>
                    <th>Ilość</th>
                    <th>Cena (szt.)</th>
                    <th>Łączna cena</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.category || "-"}</td>
                      <td>{product.quantity} szt.</td>
                      <td>{product.price ? `${product.price.toFixed(2)} zł` : "0.00 zł"}</td>
                      <td>{(product.quantity * (product.price || 0)).toFixed(2)} zł</td>
                      <td>
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => {
                            handleAddProductFromHistory(product);
                            handleCloseOrderDetails();
                          }}
                        >
                          + Dodaj do listy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="order-total-label">Łączny koszt:</td>
                    <td colSpan="2" className="order-total-value">{selectedOrder.totalCost.toFixed(2)} zł</td>
                  </tr>
                </tfoot>
              </table>
              <div className="order-actions-footer">
                <button className="reorder-btn" onClick={() => {
                  // Dodaj wszystkie produkty z tego zamówienia do aktualnej listy
                  selectedOrder.products.forEach(product => {
                    handleAddProductFromHistory(product);
                  });
                  handleCloseOrderDetails();
                }}>
                  🔄 Zamów ponownie wszystko
                </button>
                <button onClick={handleCloseOrderDetails} className="close-btn">
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;