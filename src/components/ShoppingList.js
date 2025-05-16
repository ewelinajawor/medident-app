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
  const [cheapestOffers, setCheapestOffers] = useState({});

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
        supplierPrices: product.supplierPrices || {}
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

  useEffect(() => {
    if (productOptions.length > 0 && suppliers.length > 0) {
      const offers = {};
      productOptions.forEach(product => {
        if (product.supplierPrices) {
          let minPrice = Infinity;
          let bestSupplier = '';
          
          Object.entries(product.supplierPrices).forEach(([supplier, price]) => {
            if (price < minPrice) {
              minPrice = price;
              bestSupplier = supplier;
            }
          });
          
          if (bestSupplier) {
            offers[product.value] = {
              supplier: bestSupplier,
              price: minPrice
            };
          }
        }
      });
      setCheapestOffers(offers);
    }
  }, [productOptions, suppliers]);

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
        const bestOffer = cheapestOffers[productToAdd.value] || {};
        setProducts([
          ...products,
          { 
            name: productToAdd.label, 
            quantity: quantityToAdd, 
            dateAdded: new Date().toLocaleDateString(), 
            price: productToAdd.price || 0,
            bestSupplier: bestOffer.supplier,
            bestPrice: bestOffer.price
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
    
    if (products.length === 0) {
      alert("Dodaj produkty do zamówienia przed wysłaniem!");
      return;
    }

    const providersList = selectedProviders.map((provider) => provider.label).join(", ");
    const orderSummary = {
      date: new Date().toLocaleDateString(),
      products: [...products],
      totalCost: calculateTotalCost(),
      notes: notes,
      providers: providersList,
    };
    
    setOrderHistory([...orderHistory, orderSummary]);
    setProducts([]);
    setNotes("");
    setSelectedProviders([]);
    alert(`Zamówienie zostało wysłane do: ${providersList}`);
  };

  const calculateTotalCost = () => {
    return products.reduce((total, product) => {
      const priceToUse = product.bestPrice || product.price || 0;
      return total + product.quantity * priceToUse;
    }, 0);
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
    if (products.length === 0) {
      alert("Brak produktów do eksportu!");
      return;
    }
    
    const headers = "Nazwa produktu,Ilość,Cena jednostkowa,Dostawca,Wartość\n";
    const csvContent = products.map(product => 
      `"${product.name}",${product.quantity},${product.bestPrice || product.price || 0},"${product.bestSupplier || 'Brak danych'}",${product.quantity * (product.bestPrice || product.price || 0)}`
    ).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `lista_zakupow_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const handleCopyOrder = (order) => {
    setProducts(order.products);
    setNotes(order.notes);
    setSelectedProviders(
      order.providers.split(', ').map(provider => ({
        value: provider.trim(),
        label: provider.trim()
      }))
    );
    alert("Zamówienie zostało skopiowane do bieżącej listy!");
  };

  const filteredProductOptions = selectedCategory
    ? productOptions.filter((product) => product.category === selectedCategory.value)
    : productOptions;

  return (
    <div className="shopping-list-container">
      <h2 className="welcome-message">Lista zakupów</h2>

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
            <div className="quantity-control">
              <button 
                className="quantity-btn" 
                onClick={() => setQuantityToAdd(prev => Math.max(1, prev - 1))}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
                className="quantity-input"
              />
              <button 
                className="quantity-btn" 
                onClick={() => setQuantityToAdd(prev => prev + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div className="form-group">
            <button onClick={handleAddProduct} className="add-product-button">
              <span>+</span> Dodaj
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        {products.length > 0 ? (
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>Nazwa produktu</th>
                  <th onClick={() => handleSort('quantity')}>Ilość</th>
                  <th onClick={() => handleSort('dateAdded')}>Data dodania</th>
                  <th onClick={() => handleSort('bestPrice')}>Cena jednostkowa</th>
                  <th>Dostawca</th>
                  <th>Wartość</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="product-row">
                    <td>
                      <div className="product-name" title={product.name}>
                        {product.name}
                      </div>
                    </td>
                    <td className="quantity-column">
                      <div className="quantity-control">
                        <button 
                          className="quantity-btn" 
                          onClick={() => handleQuantityChange(index, Math.max(1, product.quantity - 1))}
                        >
                          -
                        </button>
                        <span className="quantity-value">{product.quantity}</span>
                        <button 
                          className="quantity-btn" 
                          onClick={() => handleQuantityChange(index, product.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{product.dateAdded}</td>
                    <td>{(product.bestPrice || product.price || 0).toFixed(2)} zł</td>
                    <td>{product.bestSupplier || 'Brak danych'}</td>
                    <td>{(product.quantity * (product.bestPrice || product.price || 0)).toFixed(2)} zł</td>
                    <td>
                      <button 
                        className="remove-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProduct(index);
                        }}
                      >
                        <span>🗑️</span> Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5" style={{textAlign: 'right', fontWeight: 'bold'}}>Suma:</td>
                  <td style={{fontWeight: 'bold'}}>{calculateTotalCost().toFixed(2)} zł</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="empty-list">
            <p>Brak produktów na liście</p>
            <p>Dodaj produkty korzystając z formularza powyżej</p>
          </div>
        )}
      </div>

      {products.length > 0 && (
        <div className="section">
          <div className="summary-section">
            <div className="total-cost">
              <strong>Łączny koszt zamówienia: {calculateTotalCost().toFixed(2)} zł</strong>
              {cheapestOffers && (
                <div style={{marginTop: '10px', fontSize: '14px'}}>
                  <strong>Najtańsze oferty:</strong> {Object.keys(cheapestOffers).length} produktów z optymalnymi cenami
                </div>
              )}
            </div>
            
            <div className="notes-section">
              <label>Uwagi:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="notes-input"
                placeholder="Dodaj uwagi do zamówienia..."
              />
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <div className="actions-section">
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
          
          <div className="action-buttons">
            <button 
              onClick={handleSendOrder} 
              className="action-button send-button"
              disabled={products.length === 0}
            >
              <span>📤</span> Wyślij zamówienie
            </button>
            
            <button 
              onClick={handleExportCSV} 
              className="action-button export-button"
              disabled={products.length === 0}
            >
              <span>📄</span> Eksportuj do CSV
            </button>
            
            <button 
              onClick={handleExportPDF} 
              className="action-button export-button"
              disabled={products.length === 0}
            >
              <span>📄</span> Eksportuj do PDF
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">Historia zakupów</h3>
        {orderHistory.length > 0 ? (
          <div className="order-history-container">
            <div className="order-history-header">
              <div className="header-date">Data zamówienia</div>
              <div className="header-total">Wartość</div>
              <div className="header-providers">Dostawcy</div>
              <div className="header-actions">Akcje</div>
            </div>
            
            {orderHistory.map((order, index) => (
              <div 
                key={index} 
                className="order-history-item"
                onClick={() => handleViewOrderDetails(order)}
              >
                <div className="item-date">{order.date}</div>
                <div className="item-total">{order.totalCost.toFixed(2)} zł</div>
                <div className="item-providers">{order.providers}</div>
                <div className="item-actions">
                  <button
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewOrderDetails(order);
                    }}
                  >
                    <span>🔍</span> Podgląd
                  </button>
                  <button
                    className="copy-order-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyOrder(order);
                    }}
                  >
                    <span>⎘</span> Kopiuj
                  </button>
                  <button
                    className="delete-order-btn"
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
          </div>
        ) : (
          <div className="empty-history">
            <p>Brak historii zakupów</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-content">
            <h3>Szczegóły zamówienia z dnia {selectedOrder.date}</h3>
            <div className="order-info">
              <p><strong>Wysłane do:</strong> {selectedOrder.providers}</p>
              <p><strong>Uwagi:</strong> {selectedOrder.notes || 'Brak uwag'}</p>
            </div>
            
            <table className="order-products-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Ilość</th>
                  <th>Cena jednostkowa</th>
                  <th>Dostawca</th>
                  <th>Wartość</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.quantity} szt.</td>
                    <td>{(product.bestPrice || product.price || 0).toFixed(2)} zł</td>
                    <td>{product.bestSupplier || 'Brak danych'}</td>
                    <td>{(product.quantity * (product.bestPrice || product.price || 0)).toFixed(2)} zł</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="total-label"><strong>Suma:</strong></td>
                  <td className="total-value">{selectedOrder.totalCost.toFixed(2)} zł</td>
                </tr>
              </tfoot>
            </table>
            
            <button 
              onClick={handleCloseOrderDetails} 
              className="close-modal-btn"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;