import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import "./ProductList.css";

const ProductList = ({ addToShoppingList }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [shoppingList, setShoppingList] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/dental_products.json")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          setFilteredProducts(data);
        } else {
          console.error("Fetched data is not an array", data);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const addToShoppingListHandler = (product) => {
    if (product.stock < 5) {
      product.addedAutomatically = true;
    }

    // Dodajemy produkt do shoppingList
    const updatedList = [...shoppingList, product];
    setShoppingList(updatedList);
    addToShoppingList(product);
  };

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

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(value)
    );
    setFilteredProducts(filtered);
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
  };

  return (
    <div className="product-list-container">
      <h1>Lista Produktów</h1>
      <input
        type="text"
        placeholder="Szukaj produktu"
        value={searchTerm}
        onChange={handleSearch}
      />
      <table>
        <thead>
          <tr>
            <th onClick={() => sortProducts("name")}>Nazwa</th>
            <th onClick={() => sortProducts("price")}>Cena</th>
            <th onClick={() => sortProducts("stock")}>Ilość</th>
            <th onClick={() => sortProducts("supplier")}>Dostawca</th>
            <th onClick={() => sortProducts("category")}>Kategoria</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts
            .slice((page - 1) * itemsPerPage, page * itemsPerPage)
            .map((product) => (
              <tr
                key={product.product_id}
                className={product.stock < 5 ? "low-stock" : "high-stock"}
              >
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <button
                    onClick={() => handleSupplierSelect(product.supplier)}
                    style={{
                      background: "#8ba32d",
                      color: "#fff",
                      border: "none",
                      padding: "5px",
                      cursor: "pointer",
                    }}
                  >
                    {product.supplier}
                  </button>
                </td>
                <td>{product.category}</td>
                <td>
                  <button
                    onClick={() => addToShoppingListHandler(product)}
                    style={{
                      background: "linear-gradient(145deg, #220b4e, #660066)",
                      color: "#fff",
                      border: "none",
                      padding: "10px 15px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.2)",
                    }}
                    onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
                  >
                    Dodaj do listy zakupów
                  </button>
                  {product.addedAutomatically && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      Dodane automatycznie
                    </span>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Poprzednia
        </button>
        <span>Strona {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page * itemsPerPage >= filteredProducts.length}
        >
          Następna
        </button>
      </div>

      <div className="shopping-list">
        <h2>Lista Zakupów (1 lutego 2025)</h2>
        <ul>
          {shoppingList.map((product, index) => (
            <li key={index}>
              {product.name} - {product.price} PLN - {product.stock} szt.
              {selectedSupplier === product.supplier && (
                <span style={{ color: "green", marginLeft: "10px" }}>
                  Dostawca wybrany!
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProductList;
