import React, { useState, useEffect, useRef } from "react"; // Dodano useRef
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
  const navigate = useNavigate();

  // Ref do śledzenia kliknięć poza polem filtrowania
  const filterRef = useRef(null);

  useEffect(() => {
    fetch("/dental_products.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nie udało się załadować danych.");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          setFilteredProducts(data);
        } else {
          throw new Error("Dane nie są tablicą.");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
      });
  }, []);

  // Obsługa kliknięć poza polem filtrowania
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setActiveFilter(null); // Ukryj pole filtrowania
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addToShoppingListHandler = (product) => {
    addToShoppingList({ ...product, addedAutomatically: product.stock < 5 });
    setNotification(`Dodano ${product.name} do listy zakupów!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const sortProducts = (key) => {
    let direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    setFilteredProducts((prev) => [...prev].sort((a, b) => {
      return direction === "asc" ? (a[key] > b[key] ? 1 : -1) : (a[key] < b[key] ? 1 : -1);
    }));
  };

  const handleSearch = (event, field) => {
    const value = event.target.value.toLowerCase();
    setSearchTerms((prev) => ({ ...prev, [field]: value }));

    setFilteredProducts(
      products.filter((product) =>
        Object.keys(searchTerms).every((key) =>
          product[key] && typeof product[key] === "string" && product[key].toLowerCase().includes(key === field ? value : searchTerms[key])
        )
      )
    );
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setPage(1); // Resetuj stronę po zmianie liczby elementów na stronie
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="product-list-container">
      <h1>Lista Produktów</h1>
      {error && <div className="error-message">{error}</div>}
      {notification && <div className="notification">{notification}</div>}
      <div className="filters">
        <label>
          Pokaż:
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        <button onClick={toggleFilters} className="filter-button">
          Filtruj <FaFilter />
        </button>
      </div>
      {showFilters && (
        <div className="filter-menu">
          <div className="filter-group">
            <label>Nazwa:</label>
            <input
              type="text"
              placeholder="Szukaj nazwy"
              value={searchTerms.name}
              onChange={(e) => handleSearch(e, "name")}
            />
          </div>
          <div className="filter-group">
            <label>Kategoria:</label>
            <input
              type="text"
              placeholder="Szukaj kategorii"
              value={searchTerms.category}
              onChange={(e) => handleSearch(e, "category")}
            />
          </div>
          <div className="filter-group">
            <label>Dostawca:</label>
            <input
              type="text"
              placeholder="Szukaj dostawcy"
              value={searchTerms.supplier}
              onChange={(e) => handleSearch(e, "supplier")}
            />
          </div>
        </div>
      )}
      <table>
        <thead>
          <tr>
            {[
              { key: "name", label: "Nazwa" },
              { key: "price", label: "Cena" },
              { key: "stock", label: "Ilość" },
              { key: "supplier", label: "Dostawca" },
              { key: "category", label: "Kategoria" },
            ].map(({ key, label }) => (
              <th key={key} onClick={() => sortProducts(key)}>
                <div className="header-content">
                  <span>{label}</span>
                  {sortConfig.key === key && (
                    <span className="sort-icon">
                      {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                    </span>
                  )}
                  <div className="search-container" ref={filterRef}>
                    <input
                      type="text"
                      placeholder="Szukaj"
                      value={searchTerms[key]}
                      onChange={(e) => handleSearch(e, key)}
                      style={{ display: activeFilter === key ? "block" : "none" }}
                    />
                    <span
                      className="search-icon"
                      onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                    >
                      <FaSearch />
                    </span>
                  </div>
                </div>
              </th>
            ))}
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((product) => (
            <tr key={product.product_id} className={product.stock < 5 ? "low-stock" : "high-stock"}>
              <td>{product.name}</td>
              <td>{product.price}</td>
              <td>{product.stock}</td>
              <td>{product.supplier}</td>
              <td>{product.category}</td>
              <td>
                <button onClick={() => addToShoppingListHandler(product)} className="add-to-list-button">
                  <FaShoppingCart /> Dodaj
                </button>
                {product.addedAutomatically && (
                  <span className="auto-added">Dodane automatycznie</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => setPage(1)} disabled={page === 1}>
          <FaAngleDoubleLeft />
        </button>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          <FaAngleLeft />
        </button>
        <span>Strona {page} z {Math.ceil(filteredProducts.length / itemsPerPage)}</span>
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
    </div>
  );
};

export default ProductList;