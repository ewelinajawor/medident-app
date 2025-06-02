import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  X, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Store, 
  Package, 
  Plus,
  Minus,
  Gift,
  Star,
  TrendingDown,
  Filter,
  Check,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";
import "./Offers.css";

const Offers = () => {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: "Koldental",
      rating: 4.8,
      deliveryTime: "1-2 dni",
      products: [
        { id: 1, name: "Masa wyciskowa Premium", price: 50, gratis: "2 szt.", category: "Materiały wyciskowe" },
        { id: 2, name: "Narzędzia protetyczne", price: 200, category: "Instrumenty" },
        { id: 3, name: "Żel do wycisków", price: 30, category: "Materiały wyciskowe" },
      ],
    },
    {
      id: 2,
      name: "Meditrans",
      rating: 4.6,
      deliveryTime: "2-3 dni",
      products: [
        { id: 4, name: "Masa wyciskowa Premium", price: 45, category: "Materiały wyciskowe" },
        { id: 5, name: "Narzędzia protetyczne", price: 210, gratis: "1 szt.", category: "Instrumenty" },
        { id: 6, name: "Żel do wycisków", price: 25, category: "Materiały wyciskowe" },
      ],
    },
    {
      id: 3,
      name: "Marrodent",
      rating: 4.9,
      deliveryTime: "1-3 dni",
      products: [
        { id: 7, name: "Masa wyciskowa Premium", price: 55, gratis: "3 szt.", category: "Materiały wyciskowe" },
        { id: 8, name: "Narzędzia protetyczne", price: 190, category: "Instrumenty" },
        { id: 9, name: "Żel do wycisków", price: 28, category: "Materiały wyciskowe" },
      ],
    },
  ]);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    deliveryDate: "",
    supplierOrders: []
  });
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderSuppliers, setExpandedOrderSuppliers] = useState({});
  const [productsByName, setProductsByName] = useState({});
  const [notification, setNotification] = useState('');
  const [viewMode, setViewMode] = useState('comparison'); // 'comparison' or 'suppliers'
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('price'); // 'price', 'name', 'supplier'

  useEffect(() => {
    const allProducts = suppliers.flatMap((supplier) =>
      supplier.products.map((product) => ({
        ...product,
        supplier: supplier.name,
        supplierId: supplier.id,
        supplierRating: supplier.rating,
        deliveryTime: supplier.deliveryTime
      }))
    );

    const grouped = {};
    allProducts.forEach((product) => {
      if (!grouped[product.name]) {
        grouped[product.name] = [];
      }
      grouped[product.name].push(product);
    });

    Object.keys(grouped).forEach((productName) => {
      const offers = grouped[productName];
      const cheapestPrice = Math.min(...offers.map(o => o.price));
      offers.forEach(offer => {
        offer.isCheapest = offer.price === cheapestPrice;
        offer.savings = offer.price - cheapestPrice;
      });
    });

    setProductsByName(grouped);
  }, [suppliers]);

  const handleSelectProduct = (product, supplier) => {
    setSelectedProducts((prev) => [
      ...prev.filter((item) => item.product.name !== product.name),
      { product, supplier, quantity: 1 },
    ]);
    
    setNotification(`Dodano ${product.name} do koszyka`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveProduct = (productId) => {
    const product = selectedProducts.find(item => item.product.id === productId);
    setSelectedProducts((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
    
    if (product) {
      setNotification(`Usunięto ${product.product.name} z koszyka`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const openOrderForm = () => {
    const supplierGroups = {};
    
    selectedProducts.forEach(item => {
      const supplierName = item.supplier;
      if (!supplierGroups[supplierName]) {
        supplierGroups[supplierName] = [];
      }
      supplierGroups[supplierName].push(item);
    });
    
    const supplierOrders = Object.keys(supplierGroups).map(supplierName => ({
      supplierName,
      selected: true,
      note: "",
      products: supplierGroups[supplierName]
    }));
    
    setOrderFormData({
      deliveryDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
      supplierOrders
    });
    
    setShowOrderForm(true);
    if (supplierOrders.length > 0) {
      setExpandedSupplier(0);
    }
  };

  const handleSendOrder = () => {
    const selectedSuppliers = orderFormData.supplierOrders.filter(
      supplier => supplier.selected
    );
    
    if (selectedSuppliers.length === 0) {
      setNotification('Wybierz przynajmniej jednego dostawcę');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    
    const orders = selectedSuppliers.map(supplier => ({
      supplierName: supplier.supplierName,
      date: new Date().toLocaleDateString(),
      deliveryDate: orderFormData.deliveryDate,
      note: supplier.note,
      products: supplier.products,
      totalCost: supplier.products.reduce(
        (sum, item) => sum + item.product.price * item.quantity, 0
      )
    }));
    
    console.log("Zamówienia wysłane:", orders);
    setNotification(`Wysłano ${orders.length} zamówień do: ${orders.map(o => o.supplierName).join(', ')}`);
    setTimeout(() => setNotification(''), 5000);
    
    setSelectedProducts([]);
    setShowOrderForm(false);
  };

  const toggleSupplierSelection = (index) => {
    setOrderFormData(prev => {
      const updatedSupplierOrders = [...prev.supplierOrders];
      updatedSupplierOrders[index] = {
        ...updatedSupplierOrders[index],
        selected: !updatedSupplierOrders[index].selected
      };
      return {
        ...prev,
        supplierOrders: updatedSupplierOrders
      };
    });
  };

  const toggleSupplierDetails = (index) => {
    setExpandedSupplier(expandedSupplier === index ? null : index);
  };

  const toggleOrderSupplierDetails = (supplierName) => {
    setExpandedOrderSuppliers(prev => ({
      ...prev,
      [supplierName]: !prev[supplierName]
    }));
  };

  const handleDeliveryDateChange = (e) => {
    setOrderFormData(prev => ({
      ...prev,
      deliveryDate: e.target.value
    }));
  };

  const handleSupplierNoteChange = (index, value) => {
    setOrderFormData(prev => {
      const updatedSupplierOrders = [...prev.supplierOrders];
      updatedSupplierOrders[index] = {
        ...updatedSupplierOrders[index],
        note: value
      };
      return {
        ...prev,
        supplierOrders: updatedSupplierOrders
      };
    });
  };

  const addAllSupplierProducts = (supplier) => {
    const newSelectedProducts = supplier.products.map((product) => ({
      product,
      supplier: supplier.name,
      quantity: 1,
    }));
    setSelectedProducts((prev) => [...prev, ...newSelectedProducts]);
    setNotification(`Dodano wszystkie produkty z ${supplier.name}`);
    setTimeout(() => setNotification(''), 3000);
  };

  const getProductsBySupplier = () => {
    const supplierGroups = {};
    selectedProducts.forEach(item => {
      if (!supplierGroups[item.supplier]) {
        supplierGroups[item.supplier] = [];
      }
      supplierGroups[item.supplier].push(item);
    });
    return supplierGroups;
  };

  const getSupplierTotal = (products) => {
    return products.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getCategories = () => {
    const categories = new Set();
    suppliers.forEach(supplier => {
      supplier.products.forEach(product => {
        if (product.category) categories.add(product.category);
      });
    });
    return Array.from(categories);
  };

  const filteredProducts = Object.keys(productsByName)
    .filter(productName => {
      const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterCategory === 'all') return matchesSearch;
      return matchesSearch && productsByName[productName].some(p => p.category === filterCategory);
    })
    .reduce((obj, key) => {
      obj[key] = productsByName[key];
      return obj;
    }, {});

  const productsBySupplier = getProductsBySupplier();
  const categories = getCategories();

  const ProductComparisonCard = ({ productName, offers, onSelectProduct, selectedProducts }) => {
    const selectedProductId = selectedProducts.find(
      item => item.product.name === productName
    )?.product.id;

    const sortedOffers = [...offers].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'supplier') return a.supplier.localeCompare(b.supplier);
      return a.name.localeCompare(b.name);
    });

    return (
      <div className="product-comparison-card">
        <div className="product-header">
          <h4>{productName}</h4>
          <span className="offers-count">{offers.length} ofert</span>
        </div>
        
        <div className="offers-grid">
          {sortedOffers.map((offer) => (
            <div 
              key={`${offer.supplierId}-${offer.id}`} 
              className={`offer-card ${offer.isCheapest ? 'cheapest' : ''} ${selectedProductId === offer.id ? 'selected' : ''}`}
              onClick={() => onSelectProduct(offer, offer.supplier)}
            >
              <div className="offer-header">
                <div className="supplier-info">
                  <span className="supplier-name">{offer.supplier}</span>
                  <div className="supplier-meta">
                    <span className="rating">★ {offer.supplierRating}</span>
                    <span className="delivery">{offer.deliveryTime}</span>
                  </div>
                </div>
                {offer.isCheapest && (
                  <span className="best-price-badge">
                    <TrendingDown className="icon" />
                    Najlepsza cena
                  </span>
                )}
              </div>

              <div className="offer-price-section">
                <span className="price">{offer.price.toFixed(2)} zł</span>
                {offer.savings > 0 && (
                  <span className="savings">+{offer.savings.toFixed(2)} zł</span>
                )}
              </div>

              {offer.gratis && (
                <div className="gratis-section">
                  <Gift className="icon" />
                  <span>Gratis: {offer.gratis}</span>
                </div>
              )}

              <div className="offer-actions">
                <input
                  type="radio"
                  name={`product-${productName}`}
                  checked={selectedProductId === offer.id}
                  onChange={() => onSelectProduct(offer, offer.supplier)}
                  className="offer-radio"
                />
                <span className="select-label">
                  {selectedProductId === offer.id ? 'Wybrano' : 'Wybierz'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const QuantityControl = ({ value, onChange, productId }) => (
    <div className="quantity-control">
      <button 
        onClick={() => onChange(productId, value - 1)}
        className="quantity-btn"
        disabled={value <= 1}
      >
        <Minus className="icon" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(productId, Number(e.target.value))}
        className="quantity-input"
        min="1"
      />
      <button 
        onClick={() => onChange(productId, value + 1)}
        className="quantity-btn"
      >
        <Plus className="icon" />
      </button>
    </div>
  );

  return (
    <div className="offers-container">
      {/* Header */}
      <div className="offers-header">
        <div className="header-title">
          <ShoppingCart className="header-icon" />
          <h1>Porównanie Ofert</h1>
        </div>
        
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'comparison' ? 'active' : ''}`}
            onClick={() => setViewMode('comparison')}
          >
            Porównanie
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'suppliers' ? 'active' : ''}`}
            onClick={() => setViewMode('suppliers')}
          >
            Dostawcy
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="offers-controls">
        <div className="search-filter-section">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Szukaj produktów..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Wszystkie kategorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="price">Sortuj po cenie</option>
              <option value="supplier">Sortuj po dostawcy</option>
              <option value="name">Sortuj po nazwie</option>
            </select>
          </div>
        </div>
      </div>

      <div className="offers-content">
        {/* Main Content */}
        <div className="offers-main">
          {viewMode === 'comparison' ? (
            <div className="comparison-view">
              <h3>Porównanie produktów</h3>
              {Object.keys(filteredProducts).length > 0 ? (
                Object.keys(filteredProducts).map((productName) => (
                  <ProductComparisonCard
                    key={productName}
                    productName={productName}
                    offers={filteredProducts[productName]}
                    onSelectProduct={handleSelectProduct}
                    selectedProducts={selectedProducts}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <Package className="empty-icon" />
                  <h4>Brak produktów</h4>
                  <p>Nie znaleziono produktów spełniających kryteria wyszukiwania.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="suppliers-view">
              <h3>Oferty według dostawców</h3>
              <div className="suppliers-grid">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="supplier-card">
                    <div className="supplier-header">
                      <div className="supplier-info">
                        <Store className="supplier-icon" />
                        <div>
                          <h4>{supplier.name}</h4>
                          <div className="supplier-meta">
                            <span className="rating">★ {supplier.rating}</span>
                            <span className="delivery">{supplier.deliveryTime}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => addAllSupplierProducts(supplier)}
                        className="add-all-btn"
                      >
                        <Plus className="icon" />
                        Dodaj wszystkie
                      </button>
                    </div>
                    
                    <div className="supplier-products">
                      {supplier.products.map((product) => {
                        const isSelected = selectedProducts.some(
                          (item) => item.product.id === product.id
                        );
                        return (
                          <div key={product.id} className={`product-item ${isSelected ? 'selected' : ''}`}>
                            <div className="product-info">
                              <div className="product-name">{product.name}</div>
                              <div className="product-category">{product.category}</div>
                            </div>
                            <div className="product-price">{product.price.toFixed(2)} zł</div>
                            {product.gratis && (
                              <div className="product-gratis">
                                <Gift className="icon" />
                                {product.gratis}
                              </div>
                            )}
                            <button
                              onClick={() => handleSelectProduct(product, supplier.name)}
                              className={`select-btn ${isSelected ? 'selected' : ''}`}
                            >
                              {isSelected ? <Check className="icon" /> : <Plus className="icon" />}
                              {isSelected ? 'Wybrano' : 'Wybierz'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="shopping-cart">
          <div className="cart-header">
            <h3>
              <ShoppingCart className="cart-icon" />
              Koszyk ({selectedProducts.length})
            </h3>
          </div>

          {selectedProducts.length > 0 ? (
            <>
              <div className="cart-items">
                {Object.keys(productsBySupplier).map((supplierName) => (
                  <div key={supplierName} className="cart-supplier-section">
                    <div 
                      className="cart-supplier-header"
                      onClick={() => toggleOrderSupplierDetails(supplierName)}
                    >
                      <div className="supplier-info">
                        <Store className="supplier-icon" />
                        <span>{supplierName}</span>
                      </div>
                      <div className="supplier-summary">
                        <span className="supplier-total">
                          {getSupplierTotal(productsBySupplier[supplierName]).toFixed(2)} zł
                        </span>
                        {expandedOrderSuppliers[supplierName] ? (
                          <ChevronUp className="expand-icon" />
                        ) : (
                          <ChevronDown className="expand-icon" />
                        )}
                      </div>
                    </div>
                    
                    {expandedOrderSuppliers[supplierName] && (
                      <div className="cart-products">
                        {productsBySupplier[supplierName].map((item) => (
                          <div key={item.product.id} className="cart-product">
                            <div className="product-details">
                              <div className="product-name">{item.product.name}</div>
                              {item.product.gratis && (
                                <div className="product-gratis">
                                  <Gift className="icon" />
                                  +{item.product.gratis}
                                </div>
                              )}
                            </div>
                            
                            <div className="product-controls">
                              <QuantityControl 
                                value={item.quantity}
                                onChange={handleQuantityChange}
                                productId={item.product.id}
                              />
                              <div className="product-total">
                                {(item.product.price * item.quantity).toFixed(2)} zł
                              </div>
                              <button 
                                onClick={() => handleRemoveProduct(item.product.id)}
                                className="remove-btn"
                              >
                                <Trash2 className="icon" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span>Łączna wartość:</span>
                  <span className="total-amount">
                    {selectedProducts
                      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                      .toFixed(2)} zł
                  </span>
                </div>
                <button className="checkout-btn" onClick={openOrderForm}>
                  <Send className="icon" />
                  Złóż zamówienie
                </button>
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <ShoppingCart className="empty-icon" />
              <p>Koszyk jest pusty</p>
              <span>Wybierz produkty z ofert</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="order-modal-overlay">
          <div className="order-modal">
            <div className="modal-header">
              <h3>
                <FileText className="icon" />
                Finalizacja zamówienia
              </h3>
              <button className="close-btn" onClick={() => setShowOrderForm(false)}>
                <X className="icon" />
              </button>
            </div>

            <div className="modal-content">
              <div className="order-section">
                <h4>
                  <Calendar className="icon" />
                  Szczegóły zamówienia
                </h4>
                <div className="form-group">
                  <label htmlFor="deliveryDate">Preferowana data dostawy:</label>
                  <input
                    type="date"
                    id="deliveryDate"
                    value={orderFormData.deliveryDate}
                    onChange={handleDeliveryDateChange}
                    className="date-input"
                  />
                </div>
              </div>

              <div className="order-section">
                <h4>
                  <Store className="icon" />
                  Wybierz dostawców ({orderFormData.supplierOrders.filter(s => s.selected).length})
                </h4>
                {orderFormData.supplierOrders.map((supplierOrder, index) => (
                  <div key={index} className={`supplier-order-card ${supplierOrder.selected ? 'selected' : 'unselected'}`}>
                    <div 
                      className="supplier-order-header"
                      onClick={() => toggleSupplierDetails(index)}
                    >
                      <div className="supplier-order-left">
                        <label className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={supplierOrder.selected}
                            onChange={() => toggleSupplierSelection(index)}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <div className="supplier-info">
                          <span className="supplier-name">{supplierOrder.supplierName}</span>
                          <span className="products-count">
                            {supplierOrder.products.length} produktów
                          </span>
                        </div>
                      </div>
                      
                      <div className="supplier-order-right">
                        <span className="order-total">
                          {supplierOrder.products.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)} zł
                        </span>
                        {expandedSupplier === index ? (
                          <ChevronUp className="expand-icon" />
                        ) : (
                          <ChevronDown className="expand-icon" />
                        )}
                      </div>
                    </div>
                    
                    {expandedSupplier === index && (
                      <div className="supplier-order-details">
                        <div className="order-products-list">
                          {supplierOrder.products.map((item, itemIndex) => (
                            <div key={itemIndex} className="order-product-item">
                              <div className="product-info">
                                <span className="product-name">{item.product.name}</span>
                                {item.product.gratis && (
                                  <span className="product-gratis">
                                    <Gift className="icon" />
                                    +{item.product.gratis}
                                  </span>
                                )}
                              </div>
                              <div className="product-summary">
                                <span className="quantity">{item.quantity} szt.</span>
                                <span className="amount">
                                  {(item.product.price * item.quantity).toFixed(2)} zł
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="supplier-note-section">
                          <label htmlFor={`supplier-note-${index}`}>
                            <Info className="icon" /> 
                            Uwagi dla {supplierOrder.supplierName}:
                          </label>
                          <textarea
                            id={`supplier-note-${index}`}
                            rows="3"
                            value={supplierOrder.note}
                            onChange={(e) => handleSupplierNoteChange(index, e.target.value)}
                            disabled={!supplierOrder.selected}
                            placeholder="Dodatkowe informacje, uwagi specjalne..."
                            className="note-textarea"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowOrderForm(false)}>
                Anuluj
              </button>
              <button className="submit-btn" onClick={handleSendOrder}>
                <Send className="icon" />
                Wyślij zamówienie ({orderFormData.supplierOrders.filter(s => s.selected).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="notification-toast">
          <Check className="notification-icon" />
          {notification}
        </div>
      )}
    </div>
  );
};

export default Offers;