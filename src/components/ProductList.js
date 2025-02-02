import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Importujemy useNavigate
import "./ProductList.css"; // Importujemy styl CSS

const ProductList = () => {
  const [products, setProducts] = useState([]); // Przechowywanie wszystkich produktów
  const [filteredProducts, setFilteredProducts] = useState([]); // Przechowywanie filtrowanych produktów
  const [page, setPage] = useState(1); // Numer aktualnej strony
  const [itemsPerPage] = useState(100); // Ilość produktów na stronie
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" }); // Konfiguracja sortowania
  const [searchTerm, setSearchTerm] = useState(""); // Wartość wpisanego tekstu w filtrach
  const navigate = useNavigate(); // Hook do obsługi nawigacji

  // Ładujemy dane z pliku JSON
  useEffect(() => {
    fetch("/dental_products.json")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data); // Ustawiamy produkty
          setFilteredProducts(data); // Ustawiamy początkowe produkty jako filtrowane
        } else {
          console.error("Fetched data is not an array", data);
        }
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
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    setFilteredProducts(
      products.filter((product) => {
        const nameMatch = product.name && product.name.toLowerCase().includes(value);
        const supplierMatch = product.supplier && product.supplier.toLowerCase().includes(value);
        const categoryMatch = product.category && product.category.toLowerCase().includes(value);

        return nameMatch || supplierMatch || categoryMatch;
      })
    );
  };

  // Obliczanie produktów na danej stronie
  const paginate = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // Funkcja do przechodzenia do poprzedniej strony
  const goToPreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  // Funkcja do przechodzenia do następnej strony
  const goToNextPage = () => {
    if (page * itemsPerPage < filteredProducts.length) setPage(page + 1);
  };

  // Funkcja do przejścia na stronę formularza dodawania produktu
  const goToAddProduct = () => {
    navigate("/add-product"); // Zakładając, że masz stronę formularza pod tym adresem
  };

  return (
    <div className="product-list-container">
      <h1>Lista Produktów</h1>

      {/* Filtr input */}
      <div className="filter-input">
        <input 
          type="text" 
          placeholder="Wyszukaj produkt, dostawcę lub kategorię..." 
          value={searchTerm} 
          onChange={handleSearch} 
        />
      </div>

      {/* Przycisk do dodania nowego produktu */}
      <div className="add-product-button">
        <button onClick={goToAddProduct}>Dodaj Nowy Produkt</button>
      </div>

      <table>
        <thead>
          <tr>
            <th
              className={sortConfig.key === "name" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("name")}
            >
              Nazwa
            </th>
            <th
              className={sortConfig.key === "price" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("price")}
            >
              Cena
            </th>
            <th
              className={sortConfig.key === "stock" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("stock")}
            >
              Ilość
            </th>
            <th
              className={sortConfig.key === "supplier" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("supplier")}
            >
              Dostawca
            </th>
            <th
              className={sortConfig.key === "category" ? `sort-${sortConfig.direction}` : ""}
              onClick={() => sortProducts("category")}
            >
              Kategoria
            </th>
          </tr>
        </thead>
        <tbody>
          {paginate().length > 0 ? (
            paginate().map((product) => (
              <tr key={product.product_id} className={product.stock < 5 ? "low-stock" : "high-stock"}>
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.stock}</td>
                <td>{product.supplier}</td>
                <td>{product.category}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5">Brak produktów do wyświetlenia</td></tr>
          )}
        </tbody>
      </table>

      {/* Paginacja */}
      <div className="pagination">
        <button onClick={goToPreviousPage} disabled={page === 1}>
          Poprzednia
        </button>
        <span>Strona {page}</span>
        <button onClick={goToNextPage} disabled={page * itemsPerPage >= filteredProducts.length}>
          Następna
        </button>
      </div>
    </div>
  );
};

export default ProductList;
