import React, { useState } from "react";
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

  // Funkcja do wysyłania zamówienia
  const handleSendOrder = () => {
    const order = {
      date: new Date().toLocaleDateString(),
      selectedProducts,
      totalCost: selectedProducts.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
    };
    console.log("Zamówienie wysłane:", order);
    alert("Zamówienie zostało wysłane!");
    setSelectedProducts([]); // Wyczyść listę wybranych produktów
  };

  return (
    <div className="offers-container">
      <h2>Analizuj oferty</h2>

      {/* Lista dostawców z ofertami */}
      <div className="suppliers-list">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="supplier-card">
            <h3>{supplier.name}</h3>
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

      {/* Podsumowanie wybranych produktów */}
      <div className="order-summary">
        <h3>Twoje zamówienie</h3>
        {selectedProducts.length > 0 ? (
          <>
            <ul>
              {selectedProducts.map((item) => (
                <li key={item.product.id}>
                  <span>
                    {item.product.name} ({item.supplier}) - {item.product.price} zł ×{" "}
                    <input
                      type="number"
                      value={item.quantity}
                      min="1"
                      onChange={(e) =>
                        handleQuantityChange(item.product.id, Number(e.target.value))
                      }
                    />
                  </span>
                  <span>{(item.product.price * item.quantity).toFixed(2)} zł</span>
                </li>
              ))}
            </ul>
            <p>
              <strong>Łączny koszt:</strong>{" "}
              {selectedProducts
                .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                .toFixed(2)}{" "}
              zł
            </p>
            <button onClick={handleSendOrder}>Wyślij zamówienie</button>
          </>
        ) : (
          <p>Nie wybrano żadnych produktów.</p>
        )}
      </div>
    </div>
  );
};

export default Offers;