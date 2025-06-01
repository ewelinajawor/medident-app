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
import Offers from "./components/Offers"; 
import EditProfile from "./components/EditProfile";
import AdminPanel from "./components/AdminPanel";
import Savings from "./components/Savings";  // <-- nowy import
import "./App.css";

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

  const [clinicName, setClinicName] = useState("Dentica Plus");
  const [profileImage, setProfileImage] = useState(null);
  const [shoppingList, setShoppingList] = useState([]);

  const addToShoppingList = (product) => {
    setShoppingList(prevList => [...prevList, product]);
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar clinicName={clinicName} />
        <div className="main-content">
          <Routes>
            <Route 
              path="/dashboard" 
              element={<Dashboard username={username} clinicName={clinicName} profileImage={profileImage} />} 
            />
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
            <Route path="/offers" element={<Offers />} />
            <Route 
              path="/edit-profile" 
              element={<EditProfile clinicName={clinicName} updateClinicName={setClinicName} profileImage={profileImage} updateProfileImage={setProfileImage} />} 
            />
            <Route path="/admin-panel" element={<AdminPanel />} />
            {/* Nowa ścieżka do ekranu oszczędności */}
            <Route path="/savings" element={<Savings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
