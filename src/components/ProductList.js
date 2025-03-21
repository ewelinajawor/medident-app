import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
  FaFilter,
  FaExclamationTriangle,
  FaCheckCircle,
  FaRegStar,
  FaStar
} from "react-icons/fa";
import "./ProductList.css";

const ProductList = ({ addToShoppingList }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [searchTerms, setSearchTerms] = useState({ name: "", category: "", supplier: "" });
  const [activeFilter, setActiveFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [view, setView] = useState("table"); // table, cards
  const navigate = useNavigate();
  const filterRef = useRef(null);

  useEffect(() => {
    // Ładowanie ulubionych z localStorage
    const savedFavorites = localStorage.getItem("favoriteProducts");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    setLoading(true);
    fetch("/dental_products.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nie udało się załadować danych.");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Wzbogacanie danych produktów
          const processedData = data.map(product => ({
            ...product,
            isFavorite: savedFavorites ? JSON.parse(savedFavorites).includes(product.product_id) : false,
            stockStatus: product.stock < 5 ? "low" : product.stock < 10 ? "medium" : "high",
            // Upewnij się, że price jest liczbą
            price: product.price !== undefined && product.price !== null 
              ? Number(product.price) 
              : null
          }));
          
          setProducts(processedData);
          setFilteredProducts(processedData);
          
          // Wyodrębnianie unikalnych kategorii i dostawców
          const uniqueCategories = [...new Set(data.map(p => p.category))].filter(Boolean).sort();
          const uniqueSuppliers = [...new Set(data.map(p => p.supplier))].filter(Boolean).sort();
          
          setCategories(uniqueCategories);
          setSuppliers(uniqueSuppliers);
        } else {
          throw new Error("Dane nie są tablicą.");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setActiveFilter(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Zapisywanie ulubionych produktów
  useEffect(() => {
    localStorage.setItem("favoriteProducts", JSON.stringify(favorites));
  }, [favorites]);

  // Filtrowanie produktów
  useEffect(() => {
    let result = [...products];
    
    // Filtrowanie po wyszukiwanych terminach
    if (searchTerms.name || searchTerms.category || searchTerms.supplier) {
      result = result.filter(product => 
        (!searchTerms.name || (product.name && product.name.toLowerCase().includes(searchTerms.name.toLowerCase()))) &&
        (!searchTerms.category || (product.category && product.category.toLowerCase().includes(searchTerms.category.toLowerCase()))) &&
        (!searchTerms.supplier || (product.supplier && product.supplier.toLowerCase().includes(searchTerms.supplier.toLowerCase())))
      );
    }
    
    // Filtrowanie po wybranych kategoriach
    if (selectedCategories.length > 0) {
      result = result.filter(product => selectedCategories.includes(product.category));
    }
    
    // Filtrowanie po wybranych dostawcach
    if (selectedSuppliers.length > 0) {
      result = result.filter(product => selectedSuppliers.includes(product.supplier));
    }
    
    // Filtrowanie po niskim stanie magazynowym
    if (showLowStock) {
      result = result.filter(product => product.stock < 5);
    }
    
    // Sortowanie
    result.sort((a, b) => {
      const key = sortConfig.key;
      
      // Specjalne sortowanie dla ulubionych
      if (key === "favorite") {
        const favA = favorites.includes(a.product_id);
        const favB = favorites.includes(b.product_id);
        return sortConfig.direction === "asc" 
          ? (favA === favB ? 0 : favA ? -1 : 1) 
          : (favA === favB ? 0 : favA ? 1 : -1);
      }
      
      // Standardowe sortowanie
      if (a[key] === b[key]) return 0;
      
      const result = a[key] < b[key] ? -1 : 1;
      return sortConfig.direction === "asc" ? result : -result;
    });
    
    setFilteredProducts(result);
  }, [products, searchTerms, sortConfig, selectedCategories, selectedSuppliers, showLowStock, favorites]);

  const addToShoppingListHandler = (product) => {
    addToShoppingList({ ...product, addedAutomatically: product.stock < 5 });
    setNotification(`Dodano ${product.name} do listy zakupów!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const sortProducts = (key) => {
    let direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const handleSearch = (event, field) => {
    const value = event.target.value;
    setSearchTerms(prev => ({ ...prev, [field]: value }));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setPage(1);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  const handleCategoryChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSupplierChange = (supplier) => {
    if (selectedSuppliers.includes(supplier)) {
      setSelectedSuppliers(selectedSuppliers.filter(s => s !== supplier));
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplier]);
    }
  };

  const clearAllFilters = () => {
    setSearchTerms({ name: "", category: "", supplier: "" });
    setSelectedCategories([]);
    setSelectedSuppliers([]);
    setShowLowStock(false);
    setSortConfig({ key: "name", direction: "asc" });
  };

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h1>Baza Produktów</h1>
        <div className="view-toggle">
          <button 
            className={`toggle-button ${view === "table" ? "active" : ""}`} 
            onClick={() => setView("table")}
          >
            Tabela
          </button>
          <button 
            className={`toggle-button ${view === "cards" ? "active" : ""}`} 
            onClick={() => setView("cards")}
          >
            Karty
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {notification && <div className="notification">{notification}</div>}

      <div className="filters-container">
        <div className="filters-top">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Szukaj produktu..."
              value={searchTerms.name}
              onChange={(e) => handleSearch(e, "name")}
              className="main-search"
            />
          </div>
          
          <div className="filters-actions">
            <label>
              <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={10}>10 na stronę</option>
                <option value={20}>20 na stronę</option>
                <option value={50}>50 na stronę</option>
                <option value={100}>100 na stronę</option>
              </select>
            </label>
            
            <button onClick={toggleFilters} className="filter-button">
              <FaFilter /> {showFilters ? "Ukryj filtry" : "Pokaż filtry"}
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="filter-menu">
            <div className="filter-groups">
              <div className="filter-column">
                <h3>Kategorie</h3>
                <div className="checkbox-list">
                  {categories.map(category => (
                    <label key={category} className="checkbox-item">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="filter-column">
                <h3>Dostawcy</h3>
                <div className="checkbox-list">
                  {suppliers.map(supplier => (
                    <label key={supplier} className="checkbox-item">
                      <input 
                        type="checkbox" 
                        checked={selectedSuppliers.includes(supplier)}
                        onChange={() => handleSupplierChange(supplier)}
                      />
                      {supplier}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="filter-column">
                <h3>Dodatkowe filtry</h3>
                <label className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={showLowStock}
                    onChange={() => setShowLowStock(!showLowStock)}
                  />
                  Tylko produkty z niskim stanem
                </label>
                
                <div className="filter-actions">
                  <button onClick={clearAllFilters} className="clear-filters">
                    Wyczyść wszystkie filtry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="loading-indicator">Ładowanie produktów...</div>
      ) : (
        <>
          {view === "table" ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => sortProducts("favorite")} className="favorite-column">
                      <div className="header-content">
                        <span>Ulubione</span>
                        {sortConfig.key === "favorite" && (
                          <span className="sort-icon">
                            {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th onClick={() => sortProducts("name")}>
                      <div className="header-content">
                        <span>Nazwa</span>
                        {sortConfig.key === "name" && (
                          <span className="sort-icon">
                            {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th onClick={() => sortProducts("price")}>
                      <div className="header-content">
                        <span>Cena</span>
                        {sortConfig.key === "price" && (
                          <span className="sort-icon">
                            {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th onClick={() => sortProducts("stock")}>
                      <div className="header-content">
                        <span>Stan</span>
                        {sortConfig.key === "stock" && (
                          <span className="sort-icon">
                            {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th onClick={() => sortProducts("supplier")}>
                      <div className="header-content">
                        <span>Dostawca</span>
                        {sortConfig.key === "supplier" && (
                          <span className="sort-icon">
                            {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th onClick={() => sortProducts("category")}>
                      <div className="header-content">
                        <span>Kategoria</span>
                        {sortConfig.key === "category" && (
                          <span className="sort-icon">
                            {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-results">
                        Nie znaleziono produktów spełniających kryteria wyszukiwania
                      </td>
                    </tr>
                  ) : (
                    filteredProducts
                      .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                      .map((product) => (
                        <tr 
                          key={product.product_id} 
                          className={`product-row ${product.stock < 5 ? "low-stock" : product.stock < 10 ? "medium-stock" : ""}`}
                        >
                          <td className="favorite-cell">
                            <button 
                              onClick={() => toggleFavorite(product.product_id)}
                              className="favorite-button"
                            >
                              {favorites.includes(product.product_id) ? (
                                <FaStar className="favorite-icon active" />
                              ) : (
                                <FaRegStar className="favorite-icon" />
                              )}
                            </button>
                          </td>
                          <td>{product.name}</td>
                          <td className="price-cell">
                            {product.price !== undefined && product.price !== null 
                              ? `${Number(product.price).toFixed(2)} zł` 
                              : "N/A"}
                          </td>
                          <td className={`stock-cell ${product.stockStatus}-stock`}>
                            {product.stock < 5 && <FaExclamationTriangle className="warning-icon" />}
                            {product.stock}
                          </td>
                          <td>{product.supplier}</td>
                          <td>{product.category}</td>
                          <td className="actions-cell">
                            <button 
                              onClick={() => addToShoppingListHandler(product)} 
                              className="add-to-list-button"
                            >
                              <FaShoppingCart /> Dodaj
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.length === 0 ? (
                <div className="no-results">
                  Nie znaleziono produktów spełniających kryteria wyszukiwania
                </div>
              ) : (
                filteredProducts
                  .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                  .map((product) => (
                    <div 
                      key={product.product_id} 
                      className={`product-card ${product.stock < 5 ? "low-stock" : product.stock < 10 ? "medium-stock" : ""}`}
                    >
                      <div className="card-header">
                        <button 
                          onClick={() => toggleFavorite(product.product_id)}
                          className="favorite-button"
                        >
                          {favorites.includes(product.product_id) ? (
                            <FaStar className="favorite-icon active" />
                          ) : (
                            <FaRegStar className="favorite-icon" />
                          )}
                        </button>
                        <span className="product-category">{product.category}</span>
                      </div>
                      
                      <h3 className="product-name">{product.name}</h3>
                      
                      <div className="product-details">
                        <div className="detail-item">
                          <span className="detail-label">Cena:</span>
                          <span className="detail-value">
                            {product.price !== undefined && product.price !== null 
                              ? `${Number(product.price).toFixed(2)} zł` 
                              : "N/A"}
                          </span>
                        </div>
                        
                        <div className={`detail-item ${product.stockStatus}-stock`}>
                          <span className="detail-label">Stan:</span>
                          <span className="detail-value">
                            {product.stock < 5 && <FaExclamationTriangle className="warning-icon" />}
                            {product.stock}
                          </span>
                        </div>
                        
                        <div className="detail-item">
                          <span className="detail-label">Dostawca:</span>
                          <span className="detail-value">{product.supplier}</span>
                        </div>
                      </div>
                      
                      <div className="card-actions">
                        <button 
                          onClick={() => addToShoppingListHandler(product)} 
                          className="add-to-list-button"
                        >
                          <FaShoppingCart /> Dodaj do listy
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
          
          {filteredProducts.length > 0 && (
            <div className="pagination">
              <button onClick={() => setPage(1)} disabled={page === 1}>
                <FaAngleDoubleLeft />
              </button>
              <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                <FaAngleLeft />
              </button>
              <span>
                Strona {page} z {Math.ceil(filteredProducts.length / itemsPerPage)} 
                ({filteredProducts.length} {filteredProducts.length === 1 ? "produkt" : 
                  filteredProducts.length < 5 ? "produkty" : "produktów"})
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * itemsPerPage >= filteredProducts.length}
              >
                <FaAngleRight />
              </button>
              <button
                onClick={() => setPage(Math.ceil(filteredProducts.length / itemsPerPage))}
                disabled={page * itemsPerPage >= filteredProducts.length}
              >
                <FaAngleDoubleRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;