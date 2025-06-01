import React, { useState, useEffect, useMemo } from "react";
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
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // New state for enhanced features
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState("build"); // "build", "compare", "templates"
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [quickAddAmount, setQuickAddAmount] = useState(1);

  // Load data on component mount
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
      setProductOptions(sortedProducts);

      const uniqueCategories = [...new Set(fetchedProducts.map((product) => product.category))].sort();
      setCategories(uniqueCategories);
    };

    loadProducts();
  }, []);

  const fetchSuppliersFromAPI = () => {
    return [
      { value: "Koldental", label: "Koldental", color: "#3498DB" },
      { value: "Meditrans", label: "Meditrans", color: "#2ECC71" },
      { value: "Marrodent", label: "Marrodent", color: "#E74C3C" },
    ];
  };

  const fetchProductsFromAPI = async () => {
    try {
      const response = await fetch("/dental_products.json");
      if (!response.ok) {
        throw new Error("Nie udało się załadować danych.");
      }
      const data = await response.json();
      return data.map(product => ({
        ...product,
        supplierPrices: product.supplierPrices || {
          "Koldental": product.price || 0,
          "Meditrans": (product.price || 0) * 1.15,
          "Marrodent": (product.price || 0) * 1.08
        }
      }));
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
      return [
        {
          "name": "GĄSIENICA wewnętrzne",
          "category": "Paski formówki",
          "price": 18.0,
          "supplierPrices": {
            "Koldental": 18.0,
            "Meditrans": 21.25,
            "Marrodent": 19.5
          }
        },
        {
          "name": "Amalgam dentystyczny",
          "category": "Materiały wypełniające", 
          "price": 29.5,
          "supplierPrices": {
            "Koldental": 29.5,
            "Meditrans": 32.0,
            "Marrodent": 30.75
          }
        },
        {
          "name": "Rękawice nitrylowe M",
          "category": "Środki ochrony",
          "price": 24.5,
          "supplierPrices": {
            "Koldental": 26.0,
            "Meditrans": 24.5,
            "Marrodent": 25.25
          }
        },
        {
          "name": "Maseczki chirurgiczne",
          "category": "Środki ochrony",
          "price": 15.0,
          "supplierPrices": {
            "Koldental": 15.0,
            "Meditrans": 16.5,
            "Marrodent": 15.75
          }
        }
      ];
    }
  };

  // Enhanced search and filtering
  const filteredProducts = useMemo(() => {
    let filtered = productOptions;
    
    if (searchQuery.length >= 2) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    return filtered.slice(0, 8); // Limit suggestions
  }, [productOptions, searchQuery, selectedCategory]);

  // Smart suggestions based on history
  const smartSuggestions = useMemo(() => {
    if (orderHistory.length === 0) return [];
    
    // Get frequently ordered products
    const productFrequency = {};
    orderHistory.forEach(order => {
      order.products.forEach(product => {
        productFrequency[product.name] = (productFrequency[product.name] || 0) + 1;
      });
    });
    
    // Find products often bought together
    const currentProductNames = products.map(p => p.name);
    const suggestions = [];
    
    orderHistory.forEach(order => {
      const orderProductNames = order.products.map(p => p.name);
      const hasCurrentProducts = currentProductNames.some(name => 
        orderProductNames.includes(name)
      );
      
      if (hasCurrentProducts) {
        orderProductNames.forEach(productName => {
          if (!currentProductNames.includes(productName)) {
            const existing = suggestions.find(s => s.name === productName);
            if (existing) {
              existing.frequency += 1;
            } else {
              const productData = productOptions.find(p => p.name === productName);
              if (productData) {
                suggestions.push({
                  ...productData,
                  frequency: 1
                });
              }
            }
          }
        });
      }
    });
    
    return suggestions
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }, [orderHistory, products, productOptions]);

  // Predefined templates
  const templates = [
    {
      id: "basic",
      name: "🦷 Materiały podstawowe",
      description: "Codzienne potrzeby gabinetu",
      products: [
        { name: "Amalgam dentystyczny", quantity: 10 },
        { name: "Rękawice nitrylowe M", quantity: 5 },
        { name: "Maseczki chirurgiczne", quantity: 3 },
        { name: "Wadki dentystyczne", quantity: 10 }
      ]
    },
    {
      id: "endodontics",
      name: "🩺 Endodoncja - komplet",
      description: "Zestaw do leczenia kanałowego",
      products: [
        { name: "Wkłady endodontyczne", quantity: 2 },
        { name: "Cement glasjonomerowy", quantity: 3 },
        { name: "Środek dezynfekcyjny", quantity: 2 }
      ]
    },
    {
      id: "surgery",
      name: "🔪 Chirurgia - zestaw",
      description: "Materiały do zabiegów chirurgicznych",
      products: [
        { name: "Nici chirurgiczne", quantity: 5 },
        { name: "Skalpele jednorazowe", quantity: 2 },
        { name: "Igły do znieczulenia", quantity: 3 }
      ]
    },
    {
      id: "protection",
      name: "🛡️ Środki ochrony",
      description: "Kompletna ochrona personelu",
      products: [
        { name: "Rękawice nitrylowe M", quantity: 10 },
        { name: "Rękawice nitrylowe L", quantity: 5 },
        { name: "Maseczki chirurgiczne", quantity: 8 },
        { name: "Środek dezynfekcyjny", quantity: 3 }
      ]
    }
  ];

  // Grouped products for display
  const groupedProducts = useMemo(() => {
    if (!groupByCategory) return { "Wszystkie produkty": products };
    
    const grouped = {};
    products.forEach(product => {
      const productData = productOptions.find(p => p.name === product.name);
      const category = productData?.category || "Inne";
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    
    return grouped;
  }, [products, productOptions, groupByCategory]);

  // Get best supplier for each product
  const getBestSupplier = (productName) => {
    const product = productOptions.find(p => p.name === productName);
    if (!product?.supplierPrices) return null;
    
    let bestSupplier = null;
    let bestPrice = Infinity;
    
    Object.entries(product.supplierPrices).forEach(([supplier, price]) => {
      if (price < bestPrice) {
        bestPrice = price;
        bestSupplier = supplier;
      }
    });
    
    return { supplier: bestSupplier, price: bestPrice };
  };

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.length >= 2);
  };

  const handleAddProduct = (productData, quantity = quickAddAmount) => {
    const existingIndex = products.findIndex(p => p.name === productData.name);
    
    if (existingIndex !== -1) {
      const updatedProducts = [...products];
      updatedProducts[existingIndex].quantity += quantity;
      setProducts(updatedProducts);
    } else {
      const bestOffer = getBestSupplier(productData.name);
      setProducts([
        ...products,
        {
          name: productData.name,
          quantity: quantity,
          dateAdded: new Date().toLocaleDateString(),
          price: productData.price || 0,
          bestSupplier: bestOffer?.supplier,
          bestPrice: bestOffer?.price,
          category: productData.category
        }
      ]);
    }
    
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity >= 1) {
      setProducts(prev =>
        prev.map((product, i) =>
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

  const handleApplyTemplate = (template) => {
    const templateProducts = template.products
      .map(templateProduct => {
        const productData = productOptions.find(p => p.name === templateProduct.name);
        if (!productData) return null;
        
        const bestOffer = getBestSupplier(productData.name);
        return {
          name: productData.name,
          quantity: templateProduct.quantity,
          dateAdded: new Date().toLocaleDateString(),
          price: productData.price || 0,
          bestSupplier: bestOffer?.supplier,
          bestPrice: bestOffer?.price,
          category: productData.category
        };
      })
      .filter(Boolean);
    
    // Merge with existing products
    const mergedProducts = [...products];
    templateProducts.forEach(newProduct => {
      const existingIndex = mergedProducts.findIndex(p => p.name === newProduct.name);
      if (existingIndex !== -1) {
        mergedProducts[existingIndex].quantity += newProduct.quantity;
      } else {
        mergedProducts.push(newProduct);
      }
    });
    
    setProducts(mergedProducts);
    setShowTemplates(false);
    setActiveTab("build");
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

    const providersList = selectedProviders.map(p => p.label).join(", ");
    const now = new Date();
    const orderSummary = {
      date: now.toLocaleDateString('pl-PL'),
      time: now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      fullDate: now.toLocaleString('pl-PL'),
      products: [...products],
      notes: notes,
      providers: providersList,
      totalCost: calculateTotalCost()
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

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert("Brak produktów do eksportu!");
      return;
    }
    
    const headers = "Nazwa produktu,Kategoria,Ilość,Cena jednostkowa,Wartość,Dostawca\n";
    const csvContent = products.map(product => {
      const price = product.bestPrice || product.price || 0;
      const value = product.quantity * price;
      return `"${product.name}","${product.category || ''}",${product.quantity},${price.toFixed(2)},${value.toFixed(2)},"${product.bestSupplier || ''}"`;
    }).join("\n");
    
    const totalValue = calculateTotalCost();
    const summary = `\n\nPodsumowanie:,,,,"${totalValue.toFixed(2)} zł",`;
    
    const blob = new Blob([headers + csvContent + summary], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `lista_zakupow_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="shopping-list-container">
      <h2 className="welcome-message">🛒 Inteligentna Lista Zakupów</h2>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === "build" ? "active" : ""}
          onClick={() => setActiveTab("build")}
        >
          🛠️ Buduj listę
        </button>
        <button 
          className={activeTab === "compare" ? "active" : ""}
          onClick={() => setActiveTab("compare")}
        >
          💰 Porównaj ceny
        </button>
        <button 
          className={activeTab === "templates" ? "active" : ""}
          onClick={() => setActiveTab("templates")}
        >
          📋 Szablony
        </button>
      </div>

      {/* Build List Tab */}
      {activeTab === "build" && (
        <>
          {/* Smart Search Section */}
          <div className="section">
            <div className="smart-search-container">
              <div className="search-header">
                <h3>🔍 Dodaj produkty</h3>
                <div className="quick-controls">
                  <label>Szybka ilość:</label>
                  <div className="quick-amount-control">
                    <button 
                      className="amount-btn"
                      onClick={() => setQuickAddAmount(Math.max(1, quickAddAmount - 1))}
                    >
                      -
                    </button>
                    <span className="amount-value">{quickAddAmount}</span>
                    <button 
                      className="amount-btn"
                      onClick={() => setQuickAddAmount(quickAddAmount + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="search-input-container">
                <input
                  type="text"
                  className="smart-search-input"
                  placeholder="🔍 Wpisz nazwę produktu (min. 2 znaki)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                />
                
                <div className="search-filters">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-filter"
                  >
                    <option value="all">Wszystkie kategorie</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Suggestions */}
              {showSuggestions && filteredProducts.length > 0 && (
                <div className="search-suggestions">
                  {filteredProducts.map((product, index) => {
                    const bestOffer = getBestSupplier(product.name);
                    return (
                      <div 
                        key={index} 
                        className="suggestion-item"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div className="suggestion-main">
                          <div className="suggestion-name">{product.name}</div>
                          <div className="suggestion-category">{product.category}</div>
                        </div>
                        <div className="suggestion-price">
                          {bestOffer && (
                            <>
                              <div className="best-price">{bestOffer.price.toFixed(2)} zł</div>
                              <div className="best-supplier">{bestOffer.supplier}</div>
                            </>
                          )}
                        </div>
                        <button className="quick-add-btn">
                          +{quickAddAmount}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Smart Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="smart-suggestions">
                  <h4>💡 Często kupowane razem:</h4>
                  <div className="suggestion-chips">
                    {smartSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-chip"
                        onClick={() => handleAddProduct(suggestion)}
                      >
                        <span className="chip-name">{suggestion.name}</span>
                        <span className="chip-frequency">({suggestion.frequency}x)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current List */}
          <div className="section">
            <div className="list-header">
              <h3>📋 Aktualna lista ({products.length} produktów)</h3>
              <div className="list-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={groupByCategory}
                    onChange={(e) => setGroupByCategory(e.target.checked)}
                  />
                  Grupuj według kategorii
                </label>
                <div className="total-cost">
                  Wartość: <strong>{calculateTotalCost().toFixed(2)} zł</strong>
                </div>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grouped-products">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <div key={category} className="category-group">
                    {groupByCategory && (
                      <div className="category-header">
                        <h4>{category}</h4>
                        <span className="category-count">({categoryProducts.length} produktów)</span>
                      </div>
                    )}
                    
                    <div className="products-grid">
                      {categoryProducts.map((product, index) => {
                        const globalIndex = products.findIndex(p => p === product);
                        return (
                          <div key={globalIndex} className="product-card">
                            <div className="product-header">
                              <h5 className="product-name">{product.name}</h5>
                              <button 
                                className="remove-product-btn"
                                onClick={() => handleRemoveProduct(globalIndex)}
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="product-info">
                              <div className="quantity-section">
                                <label>Ilość:</label>
                                <div className="quantity-controls">
                                  <button 
                                    onClick={() => handleQuantityChange(globalIndex, product.quantity - 1)}
                                  >
                                    -
                                  </button>
                                  <span className="quantity">{product.quantity}</span>
                                  <button 
                                    onClick={() => handleQuantityChange(globalIndex, product.quantity + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              
                              {product.bestSupplier && (
                                <div className="supplier-info">
                                  <div className="best-supplier">
                                    📦 {product.bestSupplier}
                                  </div>
                                  <div className="price-info">
                                    {product.bestPrice?.toFixed(2)} zł/szt
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="quick-actions">
                              <button 
                                className="quick-action-btn"
                                onClick={() => handleQuantityChange(globalIndex, product.quantity + 5)}
                              >
                                +5
                              </button>
                              <button 
                                className="quick-action-btn"
                                onClick={() => handleQuantityChange(globalIndex, Math.max(1, product.quantity - 2))}
                              >
                                -2
                              </button>
                              <button 
                                className="quick-action-btn duplicate"
                                onClick={() => handleAddProduct({ name: product.name, category: product.category })}
                              >
                                🔄
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-list">
                <p>📝 Lista jest pusta</p>
                <p>Wyszukaj produkty powyżej lub skorzystaj z szablonów</p>
              </div>
            )}
          </div>

          {/* Notes and Actions */}
          {products.length > 0 && (
            <div className="section">
              <div className="order-finalization">
                <div className="notes-section">
                  <label>📝 Uwagi do zamówienia:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dodaj uwagi, specjalne instrukcje..."
                    className="notes-textarea"
                  />
                </div>
                
                <div className="provider-selection">
                  <label>🏢 Wybierz dostawców:</label>
                  <div className="supplier-checkboxes">
                    {suppliers.map(supplier => (
                      <label key={supplier.value} className="supplier-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedProviders.some(p => p.value === supplier.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProviders([...selectedProviders, supplier]);
                            } else {
                              setSelectedProviders(selectedProviders.filter(p => p.value !== supplier.value));
                            }
                          }}
                        />
                        <span style={{ color: supplier.color }}>{supplier.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="action-buttons">
                  <button 
                    onClick={handleSendOrder}
                    className="send-order-btn"
                    disabled={selectedProviders.length === 0}
                  >
                    📤 Wyślij zamówienie
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="export-btn"
                  >
                    📄 Eksportuj CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Compare Prices Tab */}
      {activeTab === "compare" && (
        <div className="section">
          <h3>💰 Porównanie cen dostawców</h3>
          {products.length > 0 ? (
            <div className="price-comparison-table">
              <table>
                <thead>
                  <tr>
                    <th className="product-col">Produkt</th>
                    <th className="quantity-col">Ilość</th>
                    {suppliers.map(supplier => (
                      <th key={supplier.value} style={{ color: supplier.color }}>
                        {supplier.label}
                      </th>
                    ))}
                    <th className="best-col">Najlepszy</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const productData = productOptions.find(p => p.name === product.name);
                    const supplierPrices = productData?.supplierPrices || {};
                    const bestOffer = getBestSupplier(product.name);
                    
                    return (
                      <tr key={index}>
                        <td className="product-name">{product.name}</td>
                        <td className="quantity">{product.quantity}</td>
                        {suppliers.map(supplier => {
                          const price = supplierPrices[supplier.value];
                          const totalPrice = price ? (price * product.quantity) : 0;
                          const isBest = bestOffer?.supplier === supplier.value;
                          
                          return (
                            <td 
                              key={supplier.value}
                              className={isBest ? "best-price" : ""}
                            >
                              {price ? (
                                <>
                                  <div className="unit-price">{price.toFixed(2)} zł</div>
                                  <div className="total-price">{totalPrice.toFixed(2)} zł</div>
                                </>
                              ) : (
                                <span className="no-price">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="best-supplier">
                          {bestOffer && (
                            <>
                              <div className="supplier-name">{bestOffer.supplier}</div>
                              <div className="savings">
                                {(bestOffer.price * product.quantity).toFixed(2)} zł
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="totals-row">
                    <td colSpan="2"><strong>RAZEM:</strong></td>
                    {suppliers.map(supplier => {
                      const total = products.reduce((sum, product) => {
                        const productData = productOptions.find(p => p.name === product.name);
                        const price = productData?.supplierPrices?.[supplier.value] || 0;
                        return sum + (price * product.quantity);
                      }, 0);
                      
                      return (
                        <td key={supplier.value}>
                          <strong>{total.toFixed(2)} zł</strong>
                        </td>
                      );
                    })}
                    <td>
                      <strong className="best-total">
                        {calculateTotalCost().toFixed(2)} zł
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-comparison">
              <p>Dodaj produkty do listy aby porównać ceny</p>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="section">
          <h3>📋 Szablony list zakupów</h3>
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                </div>
                
                <div className="template-products">
                  <h5>Produkty ({template.products.length}):</h5>
                  <ul>
                    {template.products.map((product, index) => (
                      <li key={index}>
                        {product.name} <span className="template-quantity">({product.quantity})</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button 
                  className="apply-template-btn"
                  onClick={() => handleApplyTemplate(template)}
                >
                  ✅ Zastosuj szablon
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order History */}
      <div className="section">
        <h3>📚 Historia zamówień</h3>
        {orderHistory.length > 0 ? (
          <div className="order-history">
            {orderHistory.slice(-5).reverse().map((order, index) => (
              <div key={index} className="history-item">
                <div className="history-header">
                  <div className="order-date-info">
                    <span className="order-date">📅 {order.date}</span>
                    {order.time && <span className="order-time">🕐 {order.time}</span>}
                  </div>
                  <span className="order-providers">🏢 {order.providers}</span>
                  <span className="order-cost">💰 {order.totalCost?.toFixed(2) || '—'} zł</span>
                </div>
                <div className="history-products">
                  {order.products.slice(0, 3).map((product, idx) => (
                    <span key={idx} className="history-product">
                      {product.name} ({product.quantity})
                    </span>
                  ))}
                  {order.products.length > 3 && (
                    <span className="more-products">+{order.products.length - 3} więcej</span>
                  )}
                </div>
                <div className="history-actions">
                  <button onClick={() => setSelectedOrder(order)}>👁️ Podgląd</button>
                  <button onClick={() => {
                    setProducts(order.products);
                    setNotes(order.notes);
                    setActiveTab("build");
                  }}>🔄 Kopiuj</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history">
            <p>Brak historii zamówień</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📋 Szczegóły zamówienia</h3>
            <div className="order-details">
              <div className="order-date-detail">
                <p><strong>Data zamówienia:</strong> {selectedOrder.date}</p>
                {selectedOrder.time && <p><strong>Godzina:</strong> {selectedOrder.time}</p>}
                {selectedOrder.fullDate && <p><strong>Pełna data:</strong> {selectedOrder.fullDate}</p>}
              </div>
              <p><strong>Dostawcy:</strong> {selectedOrder.providers}</p>
              {selectedOrder.totalCost && (
                <p><strong>Wartość:</strong> {selectedOrder.totalCost.toFixed(2)} zł</p>
              )}
              <p><strong>Uwagi:</strong> {selectedOrder.notes || "Brak uwag"}</p>
              
              <h4>Produkty:</h4>
              <div className="order-products">
                {selectedOrder.products.map((product, index) => (
                  <div key={index} className="order-product">
                    <span className="product-name">{product.name}</span>
                    <span className="product-quantity">{product.quantity} szt</span>
                    {product.bestPrice && (
                      <span className="product-value">
                        {(product.quantity * product.bestPrice).toFixed(2)} zł
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="close-modal">
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;