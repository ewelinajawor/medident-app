import React, { useState, useEffect } from "react";
import { FaCartPlus, FaTrash, FaTimes, FaPaperPlane, FaChevronDown, FaChevronUp, FaInfoCircle, FaStore, FaBoxOpen, FaSearch } from "react-icons/fa";
import "./Offers.css";

const Offers = () => {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: "Koldental",
      products: [
        { id: 1, name: "Masa wyciskowa", price: 50, gratis: "2 szt." },
        { id: 2, name: "Narzędzia protetyczne", price: 200 },
        { id: 3, name: "Żel do wycisków", price: 30 },
      ],
    },
    {
      id: 2,
      name: "Meditrans",
      products: [
        { id: 4, name: "Masa wyciskowa", price: 45 },
        { id: 5, name: "Narzędzia protetyczne", price: 210, gratis: "1 szt." },
        { id: 6, name: "Żel do wycisków", price: 25 },
      ],
    },
    {
      id: 3,
      name: "Marrodent",
      products: [
        { id: 7, name: "Masa wyciskowa", price: 55, gratis: "3 szt." },
        { id: 8, name: "Narzędzia protetyczne", price: 190 },
        { id: 9, name: "Żel do wycisków", price: 28 },
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

  useEffect(() => {
    const allProducts = suppliers.flatMap((supplier) =>
      supplier.products.map((product) => ({
        ...product,
        supplier: supplier.name,
        supplierId: supplier.id,
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
      });
    });

    setProductsByName(grouped);
  }, [suppliers]);

  const handleSelectProduct = (product, supplier) => {
    setSelectedProducts((prev) => [
      ...prev.filter((item) => item.product.name !== product.name),
      { product, supplier, quantity: 1 },
    ]);
  };

  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
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
    alert(`Wysłano ${orders.length} zamówień do dostawców: ${orders.map(o => o.supplierName).join(', ')}`);
    
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

  const filteredProducts = Object.keys(productsByName)
    .filter(productName => 
      productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((obj, key) => {
      obj[key] = productsByName[key];
      return obj;
    }, {});

  const productsBySupplier = getProductsBySupplier();

  const ProductOffers = ({ productName, offers, onSelectProduct, selectedProducts }) => {
    const selectedProductId = selectedProducts.find(
      item => item.product.name === productName
    )?.product.id;

    return (
      <div className="product-offers-card">
        <h4>{productName}</h4>
        <div className="offers-list">
          {offers.map((offer) => (
            <div 
              key={`${offer.supplierId}-${offer.id}`} 
              className={`offer-item ${offer.isCheapest ? 'cheapest' : ''}`}
            >
              <label>
                <input
                  type="radio"
                  name={`product-${productName}`}
                  checked={selectedProductId === offer.id}
                  onChange={() => onSelectProduct(offer, offer.supplier)}
                />
                <span className="supplier-name">{offer.supplier}</span>
                <span className="offer-price">{offer.price} zł</span>
                {offer.gratis && (
                  <span className="offer-gratis">Gratis: {offer.gratis}</span>
                )}
                {offer.isCheapest && (
                  <span className="cheapest-badge">Najtańsza</span>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CompactProductRow = ({ item, onQuantityChange, onRemove }) => {
    return (
      <div className="product-row">
        <div className="product-name">
          {item.product.name}
          {item.product.gratis && <span className="gratis-badge">+{item.product.gratis}</span>}
        </div>
        <div className="product-quantity">
          <input
            type="number"
            value={item.quantity}
            min="1"
            onChange={(e) => onQuantityChange(item.product.id, Number(e.target.value))}
          />
        </div>
        <div className="product-price">{item.product.price.toFixed(2)} zł</div>
        <div className="product-total">{(item.product.price * item.quantity).toFixed(2)} zł</div>
        <div className="product-actions">
          <button onClick={() => onRemove(item.product.id)} className="remove-btn">
            <FaTrash size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="offers-container">
      <div className="cheapest-offers">
        <h3>Porównanie ofert</h3>
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Wyszukaj produkt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {Object.keys(filteredProducts).length > 0 ? (
          Object.keys(filteredProducts).map((productName) => (
            <ProductOffers
              key={productName}
              productName={productName}
              offers={filteredProducts[productName]}
              onSelectProduct={handleSelectProduct}
              selectedProducts={selectedProducts}
            />
          ))
        ) : (
          <p className="no-results">Nie znaleziono produktów</p>
        )}
      </div>

      <div className="all-offers">
        <h3>Wszystkie oferty według dostawców</h3>
        <div className="offers-grid">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="supplier-card">
              <h4>{supplier.name}</h4>
              <button
                onClick={() => addAllSupplierProducts(supplier)}
                className="add-all-button"
              >
                <FaCartPlus /> Dodaj wszystkie
              </button>
              <ul>
                {supplier.products.map((product) => {
                  const isSelected = selectedProducts.some(
                    (item) => item.product.id === product.id
                  );
                  return (
                    <li key={product.id} className={isSelected ? 'selected' : ''}>
                      <label>
                        <input
                          type="radio"
                          name={`product-${product.name}`}
                          checked={isSelected}
                          onChange={() => handleSelectProduct(product, supplier.name)}
                        />
                        {product.name} - {product.price} zł{" "}
                        {product.gratis && `(gratis: ${product.gratis})`}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="order-summary">
        <h3>Twoje zamówienie ({selectedProducts.length})</h3>
        {selectedProducts.length > 0 ? (
          <>
            <div className="suppliers-list">
              {Object.keys(productsBySupplier).map((supplierName) => (
                <div key={supplierName} className="supplier-section">
                  <div 
                    className="supplier-header"
                    onClick={() => toggleOrderSupplierDetails(supplierName)}
                  >
                    <div className="supplier-name">
                      <FaStore className="supplier-icon" />
                      {supplierName}
                    </div>
                    <div className="supplier-total">
                      {getSupplierTotal(productsBySupplier[supplierName]).toFixed(2)} zł
                    </div>
                    {expandedOrderSuppliers[supplierName] ? (
                      <FaChevronUp className="expand-icon" />
                    ) : (
                      <FaChevronDown className="expand-icon" />
                    )}
                  </div>
                  
                  {expandedOrderSuppliers[supplierName] && (
                    <div className="products-table">
                      <div className="table-header">
                        <div className="col-name">Produkt</div>
                        <div className="col-quantity">Ilość</div>
                        <div className="col-price">Cena</div>
                        <div className="col-total">Wartość</div>
                        <div className="col-actions"></div>
                      </div>
                      <div className="table-body">
                        {productsBySupplier[supplierName].map((item) => (
                          <CompactProductRow
                            key={item.product.id}
                            item={item}
                            onQuantityChange={handleQuantityChange}
                            onRemove={handleRemoveProduct}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="grand-total">
                <span>Łączna wartość:</span>
                <span className="total-price">
                  {selectedProducts
                    .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                    .toFixed(2)} zł
                </span>
              </div>
              <button className="send-order-button" onClick={openOrderForm}>
                Przejdź do zamówienia
              </button>
            </div>
          </>
        ) : (
          <p className="empty-order">Nie wybrano żadnych produktów.</p>
        )}
      </div>

      {showOrderForm && (
        <div className="order-form-modal">
          <div className="order-form-content">
            <div className="modal-header">
              <h3>Finalizacja zamówienia</h3>
              <button className="close-button" onClick={() => setShowOrderForm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="order-form-section">
              <h4>Szczegóły zamówienia</h4>
              <div className="form-group">
                <label htmlFor="deliveryDate">Data dostawy:</label>
                <input
                  type="date"
                  id="deliveryDate"
                  value={orderFormData.deliveryDate}
                  onChange={handleDeliveryDateChange}
                />
              </div>
            </div>

            <div className="order-form-section">
              <h4>Wybierz dostawców</h4>
              {orderFormData.supplierOrders.map((supplierOrder, index) => (
                <div key={index} className={`supplier-order ${supplierOrder.selected ? 'selected' : 'unselected'}`}>
                  <div 
                    className="supplier-header"
                    onClick={() => toggleSupplierDetails(index)}
                  >
                    <div className="supplier-header-left">
                      <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={supplierOrder.selected}
                          onChange={() => toggleSupplierSelection(index)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <span className="supplier-name">{supplierOrder.supplierName}</span>
                      <span className="supplier-products-count">
                        ({supplierOrder.products.length} szt.)
                      </span>
                    </div>
                    
                    <div className="supplier-header-right">
                      <span className="supplier-total">
                        {supplierOrder.products.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)} zł
                      </span>
                      {expandedSupplier === index ? (
                        <FaChevronUp className="expand-icon" />
                      ) : (
                        <FaChevronDown className="expand-icon" />
                      )}
                    </div>
                  </div>
                  
                  {expandedSupplier === index && (
                    <div className="supplier-details">
                      <div className="supplier-products-summary">
                        {supplierOrder.products.map((item, itemIndex) => (
                          <div key={itemIndex} className="compact-product-item">
                            <div className="compact-product-info">
                              <span className="compact-product-name">{item.product.name}</span>
                              {item.product.gratis && (
                                <span className="compact-product-gratis">+{item.product.gratis}</span>
                              )}
                            </div>
                            <div className="compact-product-controls">
                              <span className="compact-product-quantity">{item.quantity} szt.</span>
                              <span className="compact-product-price">
                                {(item.product.price * item.quantity).toFixed(2)} zł
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="supplier-note form-group">
                        <label htmlFor={`supplier-note-${index}`}>
                          <FaInfoCircle className="note-icon" /> 
                          Uwagi dla {supplierOrder.supplierName}:
                        </label>
                        <textarea
                          id={`supplier-note-${index}`}
                          rows="3"
                          value={supplierOrder.note}
                          onChange={(e) => handleSupplierNoteChange(index, e.target.value)}
                          disabled={!supplierOrder.selected}
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="order-form-actions">
              <button className="cancel-order" onClick={() => setShowOrderForm(false)}>
                Anuluj
              </button>
              <button className="send-final-order" onClick={handleSendOrder}>
                <FaPaperPlane /> Wyślij zamówienie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;