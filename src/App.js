import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Notifications from "./components/Notifications";
import Settings from "./components/Settings";
import ShoppingList from "./components/ShoppingList";
import Orders from "./components/Orders";
import Suppliers from "./components/Suppliers"; // Import nowego komponentu
import Footer from "./components/Footer";

function App() {
  const [username] = useState("Janek");

  return (
    <Router>
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard username={username} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/suppliers" element={<Suppliers />} /> {/* Nowa ścieżka */}
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
