import React, { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Notifications from "./components/Notifications";
import Settings from "./components/Settings";
import ShoppingList from "./components/ShoppingList";
import Orders from "./components/Orders";
import Suppliers from "./components/Suppliers";
import ProductList from "./components/ProductList";
import AddProduct from "./components/AddProduct";
import Offers from "./components/Offers"; // Dodano import komponentu Offers

function App() {
  useEffect(() => {
    const checkScroll = () => {
      if (document.documentElement.scrollHeight > window.innerHeight) {
        document.querySelector('.app-container').classList.add('show-footer');
      } else {
        document.querySelector('.app-container').classList.remove('show-footer');
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);

    return () => {
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const [username] = useState("Janek");

  const [suppliers, setSuppliers] = useState([
    { id: 1, name: "Koldental", email: "info@koldental.com.pl", phone: "+48 225146200", nip: "5241001593" },
    { id: 2, name: "Meditrans", email: "e-sklep@meditrans.pl", phone: "+48 413067122", nip: "6572896029" },
    { id: 3, name: "Marrodent", email: "marek.fajkis@marrodent.pl", phone: "+33 8152013", nip: "9372343899" },
  ]);

  // Stan dla listy zakupów
  const [shoppingList, setShoppingList] = useState([]);

  // Funkcja do dodawania produktów do listy zakupów
  const addToShoppingList = (product) => {
    // Dodanie tylko wybranego produktu do shoppingList
    setShoppingList(prevList => [...prevList, product]);
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard username={username} />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/shopping-list"
              element={<ShoppingList shoppingList={shoppingList} />}
            />
            <Route path="/orders" element={<Orders />} />
            <Route
              path="/suppliers"
              element={<Suppliers suppliers={suppliers} setSuppliers={setSuppliers} />}
            />
            <Route
              path="/product-list"
              element={<ProductList addToShoppingList={addToShoppingList} />}
            />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/offers" element={<Offers />} /> {/* Dodano nową ścieżkę dla Offers */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;