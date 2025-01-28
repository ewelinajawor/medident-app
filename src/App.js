import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Notifications from "./components/Notifications";
import Settings from "./components/Settings";
import ShoppingList from "./components/ShoppingList";
import Orders from "./components/Orders"; // Importuj komponent Orders
import ProductList from "./components/ProductList"; // Import nowego komponentu do zapasów

function App() {
  const [username] = useState("Janek"); // Przykładowa nazwa użytkownika, możesz ją dynamicznie pobierać

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/dashboard" element={<Dashboard username={username} />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/shopping-list" element={<ShoppingList />} />
        <Route path="/orders" element={<Orders />} /> {/* Dodaj trasę do Orders */}
        <Route path="/product-list" element={<ProductList />} /> {/* Trasa dla listy produktów */}
      </Routes>
    </Router>
  );
}

export default App;
