import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Gift,
  Check
} from "lucide-react";
import "./Offers.css";
import { appendOrder } from "../utils/storage";
import { formatMoney } from '../utils/format';

const Offers = () => {
  const [suppliers] = useState([
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
      setNotification('Wybierz przynajmniej jednego dostawcę.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    
    const orders = selectedSuppliers.map(supplier =>
      appendOrder({
        supplier: supplier.supplierName,
        items: supplier.products.map(item => ({
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
          quantity: item.quantity,
        })),
        notes: supplier.note,
        deliveryDate: orderFormData.deliveryDate,
      })
    );

    setNotification(`Zapisano ${orders.length} zamówień (${orders.map(o => o.supplier).join(', ')}) – zobacz zakładkę „Zamówienia”.`);
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
    // Jeden produkt (po nazwie) może być w koszyku tylko raz – tak samo jak przy pojedynczym wyborze.
    const names = supplier.products.map((p) => p.name);
    const newSelectedProducts = supplier.products.map((product) => ({
      product,
      supplier: supplier.name,
      quantity: 1,
    }));
    setSelectedProducts((prev) => [
      ...prev.filter((item) => !names.includes(item.product.name)),
      ...newSelectedProducts,
    ]);
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

  const renderComparisonCard = (productName, offers) => {
    const selectedProductId = selectedProducts.find(
      item => item.product.name === productName
    )?.product.id;

    const sortedOffers = [...offers].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'supplier') return a.supplier.localeCompare(b.supplier);
      return a.name.localeCompare(b.name);
    });

    return (
      <section key={productName} className="card card-flush of-product">
        <div className="of-product-head">
          <h3>{productName}</h3>
          <span className="muted">{offers.length} {offers.length === 1 ? 'oferta' : offers.length < 5 ? 'oferty' : 'ofert'}</span>
        </div>

        <ul className="of-offers">
          {sortedOffers.map((offer) => {
            const isSelected = selectedProductId === offer.id;
            return (
              <li key={`${offer.supplierId}-${offer.id}`}>
                <label className={`of-offer ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`product-${productName}`}
                    checked={isSelected}
                    onChange={() => handleSelectProduct(offer, offer.supplier)}
                  />
                  <span className="of-offer-supplier">
                    <span className="of-offer-name">{offer.supplier}</span>
                    <span className="of-offer-meta">
                      Ocena {offer.supplierRating} · dostawa {offer.deliveryTime}
                    </span>
                  </span>
                  <span className="of-offer-tags">
                    {offer.gratis && (
                      <span className="badge badge-accent"><Gift /> Gratis: {offer.gratis}</span>
                    )}
                    {offer.isCheapest && <span className="badge badge-success">Najniższa cena</span>}
                  </span>
                  <span className="of-offer-price">
                    <span className="num">{formatMoney(offer.price)}</span>
                    {offer.savings > 0 && (
                      <span className="of-offer-diff num">+{formatMoney(offer.savings)}</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  const renderQuantityControl = (value, productId) => (
    <div className="stepper">
      <button
        type="button"
        onClick={() => handleQuantityChange(productId, value - 1)}
        disabled={value <= 1}
        aria-label="Zmniejsz ilość"
      >
        <Minus />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => handleQuantityChange(productId, Number(e.target.value))}
        min="1"
        aria-label="Ilość"
      />
      <button
        type="button"
        onClick={() => handleQuantityChange(productId, value + 1)}
        aria-label="Zwiększ ilość"
      >
        <Plus />
      </button>
    </div>
  );

  const cartTotal = selectedProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const selectedSupplierCount = orderFormData.supplierOrders.filter(s => s.selected).length;

  return (
    <div className="offers page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Porównanie ofert</h1>
          <p className="page-subtitle">Ceny tych samych produktów u różnych dostawców.</p>
        </div>
        <div className="of-segmented" role="group" aria-label="Widok">
          <button
            type="button"
            className={viewMode === 'comparison' ? 'active' : ''}
            aria-pressed={viewMode === 'comparison'}
            onClick={() => setViewMode('comparison')}
          >
            Według produktów
          </button>
          <button
            type="button"
            className={viewMode === 'suppliers' ? 'active' : ''}
            aria-pressed={viewMode === 'suppliers'}
            onClick={() => setViewMode('suppliers')}
          >
            Według dostawców
          </button>
        </div>
      </header>

      <div className="of-toolbar">
        <div className="of-search">
          <Search className="of-search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Szukaj produktu"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          aria-label="Kategoria"
        >
          <option value="all">Wszystkie kategorie</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sortowanie"
        >
          <option value="price">Sortuj: cena</option>
          <option value="supplier">Sortuj: dostawca</option>
          <option value="name">Sortuj: nazwa</option>
        </select>
      </div>

      <div className="of-layout">
        <div className="of-main">
          {viewMode === 'comparison' ? (
            Object.keys(filteredProducts).length > 0 ? (
              Object.keys(filteredProducts).map((productName) =>
                renderComparisonCard(productName, filteredProducts[productName])
              )
            ) : (
              <div className="empty-state">
                <h4>Brak produktów</h4>
                <p>Nie znaleziono produktów spełniających kryteria wyszukiwania.</p>
              </div>
            )
          ) : (
            <div className="of-suppliers">
              {suppliers.map((supplier) => (
                <section key={supplier.id} className="card card-flush of-supplier">
                  <div className="of-product-head">
                    <div>
                      <h3>{supplier.name}</h3>
                      <span className="of-offer-meta">
                        Ocena {supplier.rating} · dostawa {supplier.deliveryTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addAllSupplierProducts(supplier)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Plus /> Dodaj wszystkie
                    </button>
                  </div>

                  <ul className="of-supplier-products">
                    {supplier.products.map((product) => {
                      const isSelected = selectedProducts.some(
                        (item) => item.product.id === product.id
                      );
                      return (
                        <li key={product.id} className={isSelected ? 'selected' : ''}>
                          <span className="of-offer-supplier">
                            <span className="of-offer-name">{product.name}</span>
                            <span className="of-offer-meta">
                              {product.category}
                              {product.gratis && ` · gratis: ${product.gratis}`}
                            </span>
                          </span>
                          <span className="num">{formatMoney(product.price)}</span>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product, supplier.name)}
                            className={`btn btn-sm ${isSelected ? 'btn-ghost of-selected-btn' : 'btn-secondary'}`}
                          >
                            {isSelected ? <Check /> : <Plus />}
                            {isSelected ? 'Wybrano' : 'Wybierz'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="card card-flush of-cart">
          <div className="of-product-head">
            <h3>Koszyk</h3>
            <span className="muted num">{selectedProducts.length} poz.</span>
          </div>

          {selectedProducts.length > 0 ? (
            <>
              <div className="of-cart-groups">
                {Object.keys(productsBySupplier).map((supplierName) => (
                  <div key={supplierName} className="of-cart-group">
                    <button
                      type="button"
                      className="of-cart-group-head"
                      onClick={() => toggleOrderSupplierDetails(supplierName)}
                      aria-expanded={!!expandedOrderSuppliers[supplierName]}
                    >
                      <span className="of-offer-name">{supplierName}</span>
                      <span className="muted num">
                        {productsBySupplier[supplierName].length} poz.
                      </span>
                      <span className="num of-cart-group-total">
                        {formatMoney(getSupplierTotal(productsBySupplier[supplierName]))}
                      </span>
                      {expandedOrderSuppliers[supplierName] ? (
                        <ChevronUp className="of-chevron" />
                      ) : (
                        <ChevronDown className="of-chevron" />
                      )}
                    </button>

                    {expandedOrderSuppliers[supplierName] && (
                      <ul className="of-cart-items">
                        {productsBySupplier[supplierName].map((item) => (
                          <li key={item.product.id}>
                            <div className="of-cart-item-head">
                              <span>{item.product.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(item.product.id)}
                                className="of-icon-btn"
                                aria-label={`Usuń ${item.product.name}`}
                                title="Usuń"
                              >
                                <Trash2 />
                              </button>
                            </div>
                            {item.product.gratis && (
                              <span className="of-offer-meta">Gratis: {item.product.gratis}</span>
                            )}
                            <div className="of-cart-item-foot">
                              {renderQuantityControl(item.quantity, item.product.id)}
                              <span className="num">
                                {formatMoney((item.product.price * item.quantity))}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="of-cart-foot">
                <div className="of-cart-total">
                  <span>Razem</span>
                  <span className="num">{formatMoney(cartTotal)}</span>
                </div>
                <button type="button" className="btn btn-primary of-full" onClick={openOrderForm}>
                  <Send /> Złóż zamówienie
                </button>
              </div>
            </>
          ) : (
            <p className="of-cart-empty muted">
              Koszyk jest pusty. Wybierz oferty z listy.
            </p>
          )}
        </aside>
      </div>

      {showOrderForm && (
        <div className="modal-backdrop">
          <div className="of-modal" role="dialog" aria-modal="true" aria-labelledby="of-modal-title">
            <div className="of-modal-head">
              <h3 id="of-modal-title">Finalizacja zamówienia</h3>
              <button
                type="button"
                className="of-icon-btn"
                onClick={() => setShowOrderForm(false)}
                aria-label="Zamknij"
              >
                <X />
              </button>
            </div>

            <div className="of-modal-body">
              <label className="of-field">
                <span className="of-field-label">Preferowana data dostawy</span>
                <input
                  type="date"
                  id="deliveryDate"
                  value={orderFormData.deliveryDate}
                  onChange={handleDeliveryDateChange}
                />
              </label>

              <div className="of-field">
                <span className="of-field-label">
                  Dostawcy <span className="muted num">({selectedSupplierCount} wybranych)</span>
                </span>
                {orderFormData.supplierOrders.map((supplierOrder, index) => (
                  <div
                    key={index}
                    className={`of-supplier-order ${supplierOrder.selected ? '' : 'unselected'}`}
                  >
                    <div className="of-supplier-order-head">
                      <input
                        type="checkbox"
                        checked={supplierOrder.selected}
                        onChange={() => toggleSupplierSelection(index)}
                        aria-label={`Zamów u ${supplierOrder.supplierName}`}
                      />
                      <button
                        type="button"
                        className="of-supplier-order-toggle"
                        onClick={() => toggleSupplierDetails(index)}
                        aria-expanded={expandedSupplier === index}
                      >
                        <span className="of-offer-supplier">
                          <span className="of-offer-name">{supplierOrder.supplierName}</span>
                          <span className="of-offer-meta">{supplierOrder.products.length} poz.</span>
                        </span>
                        <span className="num">
                          {formatMoney(supplierOrder.products.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}
                        </span>
                        {expandedSupplier === index ? (
                          <ChevronUp className="of-chevron" />
                        ) : (
                          <ChevronDown className="of-chevron" />
                        )}
                      </button>
                    </div>

                    {expandedSupplier === index && (
                      <div className="of-supplier-order-body">
                        <ul className="of-order-lines">
                          {supplierOrder.products.map((item, itemIndex) => (
                            <li key={itemIndex}>
                              <span>
                                {item.product.name}
                                {item.product.gratis && (
                                  <span className="of-offer-meta"> · gratis {item.product.gratis}</span>
                                )}
                              </span>
                              <span className="num muted">{item.quantity} szt.</span>
                              <span className="num">{formatMoney((item.product.price * item.quantity))}</span>
                            </li>
                          ))}
                        </ul>
                        <label className="of-field">
                          <span className="of-field-label">Uwagi dla {supplierOrder.supplierName}</span>
                          <textarea
                            id={`supplier-note-${index}`}
                            rows="3"
                            value={supplierOrder.note}
                            onChange={(e) => handleSupplierNoteChange(index, e.target.value)}
                            disabled={!supplierOrder.selected}
                            placeholder="Dodatkowe informacje dla dostawcy"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="of-modal-foot">
              <button type="button" className="btn btn-secondary" onClick={() => setShowOrderForm(false)}>
                Anuluj
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSendOrder}>
                <Send /> Wyślij zamówienie ({selectedSupplierCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="notice of-toast" role="status">
          <Check /> {notification}
        </div>
      )}
    </div>
  );
};

export default Offers;
