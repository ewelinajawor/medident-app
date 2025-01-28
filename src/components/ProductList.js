import React, { useState, useEffect, useRef } from "react";
import "./ProductList.css"; // Importujemy styl CSS

const ProductList = () => {
  const [products, setProducts] = useState([]); // Przechowywanie wszystkich produktów
  const [filteredProducts, setFilteredProducts] = useState([]); // Przechowywanie filtrowanych produktów
  const [filterActive, setFilterActive] = useState(null); // Przechowywanie aktywnego filtra
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" }); // Konfiguracja sortowania
  const filterInputRef = useRef(null); // Referencja do pola filtra, by kontrolować kliknięcie poza nim

  // Ładujemy dane z pliku JSON
  useEffect(() => {
    fetch("/dental_products.json")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data); // Ustawiamy produkty
        setFilteredProducts(data); // Ustawiamy początkowe produkty jako filtrowane
      })
      .catch((error) => console.error("Błąd w ładowaniu danych:", error));
  }, []);

  // Funkcja do sortowania produktów
  const sortProducts = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredProducts(sortedProducts);
  };

  // Funkcja do filtrowania produktów
  const filterProducts = (key, value) => {
    const filtered = products.filter((product) => product[key].toLowerCase().includes(value.toLowerCase()));
    setFilteredProducts(filtered);
  };

  // Funkcja do przełączania aktywnego filtra
  const toggleFilter = (key) => {
    if (filterActive === key) {
      setFilterActive(null); // Jeśli kliknęliśmy na ten sam filtr, to go usuwamy
    } else {
      setFilterActive(key); // W przeciwnym razie ustawiamy ten filtr jako aktywny
    }
  };

  // Funkcja do obsługi kliknięcia poza oknem filtra (zamknięcie okna)
  const handleClickOutside = (event) => {
    if (filterInputRef.current && !filterInputRef.current.contains(event.target)) {
      setFilterActive(null); // Zamknięcie filtra
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside); // Nasłuchujemy kliknięć poza filtrami
    return () => {
      document.removeEventListener("click", handleClickOutside); // Usuwamy nasłuchiwacz przy unmount
    };
  }, []);

  return (
    <div className="product-list-container">
      <h1>Lista Produktów</h1>
      <table>
        <thead>
          <tr>
            {/* Kolumna Nazwa */}
            <th
              className={sortConfig.key === "name" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("name")}
              onDoubleClick={() => toggleFilter("name")}
            >
              Nazwa
              {/* Ikona rozwinięcia filtra przy kliknięciu */}
              {filterActive === "name" && (
                <div className="filter-dropdown active" ref={filterInputRef}>
                  <input
                    type="text"
                    onChange={(e) => filterProducts("name", e.target.value)}
                    placeholder="Filtruj po nazwie..."
                  />
                </div>
              )}
            </th>

            {/* Kolumna Cena */}
            <th
              className={sortConfig.key === "price" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("price")}
            >
              Cena
            </th>

            {/* Kolumna Ilość */}
            <th
              className={sortConfig.key === "stock" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("stock")}
            >
              Ilość
            </th>

            {/* Kolumna Dostawca */}
            <th
              className={sortConfig.key === "supplier" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("supplier")}
              onDoubleClick={() => toggleFilter("supplier")}
            >
              Dostawca
              {filterActive === "supplier" && (
                <div className="filter-dropdown active" ref={filterInputRef}>
                  <input
                    type="text"
                    onChange={(e) => filterProducts("supplier", e.target.value)}
                    placeholder="Filtruj po dostawcy..."
                  />
                </div>
              )}
            </th>

            {/* Kolumna Kategoria */}
            <th
              className={sortConfig.key === "category" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("category")}
              onDoubleClick={() => toggleFilter("category")}
            >
              Kategoria
              {filterActive === "category" && (
                <div className="filter-dropdown active" ref={filterInputRef}>
                  <input
                    type="text"
                    onChange={(e) => filterProducts("category", e.target.value)}
                    placeholder="Filtruj po kategorii..."
                  />
                </div>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Renderowanie produktów */}
          {filteredProducts.map((product) => (
            <tr key={product.product_id} className={product.stock < 5 ? "low-stock" : "high-stock"}>
              <td>{product.name}</td>
              <td>{product.price}</td>
              <td>{product.stock}</td>
              <td>{product.supplier}</td>
              <td>{product.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;
