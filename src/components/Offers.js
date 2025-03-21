import React, { useState } from "react";
import { FaCartPlus, FaTrash, FaTimes, FaPaperPlane, FaChevronDown, FaChevronUp, FaInfoCircle, FaStore, FaBoxOpen } from "react-icons/fa";
import "./Offers.css";

const Offers = () => {
  // Przykładowi dostawcy z ofertami
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

  // Stan dla wybranych produktów
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Stan dla formularza zamówienia
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    deliveryDate: "",
    supplierOrders: []
  });
  
  // Stan dla widoczności szczegółów dostawcy w formularzu
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  
  // Stan dla rozwiniętych dostawców w głównym widoku
  const [expandedOrderSuppliers, setExpandedOrderSuppliers] = useState({});

  // Funkcja do wyboru produktu
  const handleSelectProduct = (product, supplier) => {
    const isProductSelected = selectedProducts.some((item) => item.product.id === product.id);

    if (isProductSelected) {
      // Usuń produkt z listy wybranych
      setSelectedProducts((prev) =>
        prev.filter((item) => item.product.id !== product.id)
      );
    } else {
      // Dodaj produkt do listy wybranych
      setSelectedProducts((prev) => [
        ...prev,
        { product, supplier, quantity: 1 }, // Domyślna ilość to 1
      ]);
    }
  };

  // Funkcja do zmiany ilości produktu
  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Funkcja do usuwania produktu z zamówienia
  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  // Funkcja otwierająca formularz zamówienia
  const openOrderForm = () => {
    // Grupowanie produktów według dostawców
    const supplierGroups = {};
    
    selectedProducts.forEach(item => {
      // Znajdź dostawcę produktu
      const supplierName = item.supplier;
      
      if (!supplierGroups[supplierName]) {
        supplierGroups[supplierName] = [];
      }
      
      supplierGroups[supplierName].push(item);
    });
    
    // Przygotuj dane dla formularza
    const supplierOrders = Object.keys(supplierGroups).map(supplierName => ({
      supplierName,
      selected: true,
      note: "", // Osobna uwaga dla każdego dostawcy
      products: supplierGroups[supplierName]
    }));
    
    setOrderFormData({
      deliveryDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
      supplierOrders
    });
    
    setShowOrderForm(true);
    // Domyślnie rozwijamy tylko pierwszego dostawcę
    if (supplierOrders.length > 0) {
      setExpandedSupplier(0);
    }
  };

  // Funkcja do wysyłania zamówienia
  const handleSendOrder = () => {
    // Filtruj tylko wybrane dostawcy
    const selectedSuppliers = orderFormData.supplierOrders.filter(
      supplier => supplier.selected
    );
    
    // Twórz oddzielne zamówienia dla każdego dostawcy
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
    
    // Wyświetl potwierdzenie
    console.log("Zamówienia wysłane:", orders);
    alert(`Wysłano ${orders.length} zamówień do dostawców: ${orders.map(o => o.supplierName).join(', ')}`);
    
    // Wyczyść dane
    setSelectedProducts([]);
    setShowOrderForm(false);
  };

  // Funkcja do zmiany wybranego dostawcy
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

  // Funkcja do rozwijania/zwijania szczegółów dostawcy w formularzu
  const toggleSupplierDetails = (index) => {
    setExpandedSupplier(expandedSupplier === index ? null : index);
  };
  
  // Funkcja do rozwijania/zwijania dostawcy w głównym widoku zamówienia
  const toggleOrderSupplierDetails = (supplierName) => {
    setExpandedOrderSuppliers(prev => ({
      ...prev,
      [supplierName]: !prev[supplierName]
    }));
  };

  // Funkcja do zmiany daty dostawy
  const handleDeliveryDateChange = (e) => {
    setOrderFormData(prev => ({
      ...prev,
      deliveryDate: e.target.value
    }));
  };

  // Funkcja do zmiany uwagi dla konkretnego dostawcy
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

  // Funkcja do dodania całego zamówienia od danego dostawcy
  const addAllSupplierProducts = (supplier) => {
    const newSelectedProducts = supplier.products.map((product) => ({
      product,
      supplier: supplier.name,
      quantity: 1, // Domyślna ilość to 1
    }));
    setSelectedProducts((prev) => [...prev, ...newSelectedProducts]);
  };

  // Funkcja do znajdowania najtańszych ofert
  const findCheapestOffers = () => {
    const allProducts = suppliers.flatMap((supplier) =>
      supplier.products.map((product) => ({
        ...product,
        supplier: supplier.name,
      }))
    );

    // Grupowanie produktów po nazwie i znajdowanie najtańszej oferty
    const cheapestOffers = {};
    allProducts.forEach((product) => {
      if (
        !cheapestOffers[product.name] ||
        product.price < cheapestOffers[product.name].price
      ) {
        cheapestOffers[product.name] = product;
      }
    });

    return Object.values(cheapestOffers);
  };

  // Grupowanie wybranych produktów według dostawcy
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
  
  // Obliczanie sumy dla danego dostawcy
  const getSupplierTotal = (products) => {
    return products.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  // Najtańsze oferty
  const cheapestOffers = findCheapestOffers();
  
  // Produkty pogrupowane według dostawcy
  const productsBySupplier = getProductsBySupplier();

  return (
    <div className="offers-container">
      {/* Sekcja z najtańszymi ofertami */}
      <div className="cheapest-offers">
        <h3>Najtańsze oferty</h3>
        <div className="offers-grid">
          {cheapestOffers.map((product) => (
            <div key={product.id} className="offer-card">
              <label>
                <input
                  type="checkbox"
                  checked={selectedProducts.some(
                    (item) => item.product.id === product.id
                  )}
                  onChange={() => handleSelectProduct(product, product.supplier)}
                />
                {product.name} - {product.price} zł (od {product.supplier}){" "}
                {product.gratis && `(gratis: ${product.gratis})`}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Lista wszystkich dostawców z ofertami */}
      <div className="all-offers">
        <h3>Wszystkie oferty</h3>
        <div className="offers-grid">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="supplier-card">
              <h4>{supplier.name}</h4>
              <button
                onClick={() => addAllSupplierProducts(supplier)}
                className="add-all-button"
              >
                <FaCartPlus /> Dodaj całe zamówienie
              </button>
              <ul>
                {supplier.products.map((product) => (
                  <li key={product.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedProducts.some(
                          (item) => item.product.id === product.id
                        )}
                        onChange={() => handleSelectProduct(product, supplier.name)}
                      />
                      {product.name} - {product.price} zł{" "}
                      {product.gratis && `(gratis: ${product.gratis})`}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Podsumowanie wybranych produktów - nowy układ z grupowaniem według dostawców */}
      <div className="order-summary">
        <h3>Twoje zamówienie</h3>
        {selectedProducts.length > 0 ? (
          <>
            <div className="order-suppliers-list">
              {Object.keys(productsBySupplier).map((supplierName) => (
                <div key={supplierName} className="order-supplier-card">
                  <div 
                    className="order-supplier-header"
                    onClick={() => toggleOrderSupplierDetails(supplierName)}
                  >
                    <div className="order-supplier-info">
                      <FaStore className="supplier-icon" />
                      <span className="supplier-name">{supplierName}</span>
                      <span className="supplier-products-count">
                        ({productsBySupplier[supplierName].length} {productsBySupplier[supplierName].length === 1 ? 'produkt' : 'produkty'})
                      </span>
                    </div>
                    <div className="order-supplier-summary">
                      <span className="supplier-total">
                        {getSupplierTotal(productsBySupplier[supplierName]).toFixed(2)} zł
                      </span>
                      {expandedOrderSuppliers[supplierName] ? (
                        <FaChevronUp className="expand-icon" />
                      ) : (
                        <FaChevronDown className="expand-icon" />
                      )}
                    </div>
                  </div>
                  
                  {expandedOrderSuppliers[supplierName] && (
                    <div className="order-supplier-products">
                      {productsBySupplier[supplierName].map((item) => (
                        <div key={item.product.id} className="order-product-item">
                          <div className="order-product-info">
                            <FaBoxOpen className="product-icon" />
                            <span className="product-name">{item.product.name}</span>
                            {item.product.gratis && (
                              <span className="product-gratis">Gratis: {item.product.gratis}</span>
                            )}
                          </div>
                          
                          <div className="order-product-actions">
                            <div className="quantity-control">
                              <span>{item.product.price.toFixed(2)} zł × </span>
                              <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                onChange={(e) =>
                                  handleQuantityChange(item.product.id, Number(e.target.value))
                                }
                              />
                            </div>
                            
                            <div className="order-product-total">
                              {(item.product.price * item.quantity).toFixed(2)} zł
                            </div>
                            
                            <button
                              onClick={() => handleRemoveProduct(item.product.id)}
                              className="delete-order-icon"
                              title="Usuń z zamówienia"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="order-total">
              <strong>Łączny koszt:</strong>
              <span className="total-price">
                {selectedProducts
                  .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                  .toFixed(2)} zł
              </span>
            </div>
            
            <button className="send-order-button" onClick={openOrderForm}>
              Przejdź do zamówienia
            </button>
          </>
        ) : (
          <p className="empty-order">Nie wybrano żadnych produktów.</p>
        )}
      </div>

      {/* Modal formularza zamówienia z rozwijanymi dostawcami */}
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
                <label htmlFor="deliveryDate">Wybierz datę dostawy:</label>
                <input
                  type="date"
                  id="deliveryDate"
                  value={orderFormData.deliveryDate}
                  onChange={handleDeliveryDateChange}
                />
              </div>
            </div>

            <div className="order-form-section">
              <h4>Wybierz dostawców do wysłania zamówienia</h4>
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
                        ({supplierOrder.products.length} {supplierOrder.products.length === 1 ? 'produkt' : 'produkty'})
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
                        <div className="supplier-products-list">
                          {supplierOrder.products.map((item, itemIndex) => (
                            <div key={itemIndex} className="product-item">
                              <span className="product-name">{item.product.name}</span>
                              <span className="product-quantity">{item.quantity} szt.</span>
                              <span className="product-price">{(item.product.price * item.quantity).toFixed(2)} zł</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Uwaga dla konkretnego dostawcy */}
                      <div className="supplier-note form-group">
                        <label htmlFor={`supplier-note-${index}`}>
                          <FaInfoCircle className="note-icon" /> 
                          Uwagi do zamówienia od {supplierOrder.supplierName}:
                        </label>
                        <textarea
                          id={`supplier-note-${index}`}
                          rows="3"
                          value={supplierOrder.note}
                          onChange={(e) => handleSupplierNoteChange(index, e.target.value)}
                          placeholder={`Dodaj uwagi do zamówienia od ${supplierOrder.supplierName}...`}
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