import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Notifications from "./components/Notifications";
import Settings from "./components/Settings";
import ShoppingList from "./components/ShoppingList";
import Orders from "./components/Orders";
import Suppliers from "./components/Suppliers";
import ProductList from "./components/ProductList";
import Offers from "./components/Offers";
import EditProfile from "./components/EditProfile";
import AdminPanel from "./components/AdminPanel";
import Savings from "./components/Savings";
import { KEYS, readJSON, writeJSON } from "./utils/storage";
import "./App.css";

const DEFAULT_CLINIC_NAME = "Dentica Plus";

function App() {
  const [profile, setProfile] = useState(() => {
    const saved = readJSON(KEYS.profile, {});
    return {
      clinicName: saved.clinicName || DEFAULT_CLINIC_NAME,
      profilePicture: saved.profilePicture || null,
    };
  });

  const handleProfileUpdate = (clinicName, profilePicture) => {
    setProfile({ clinicName, profilePicture });
    // Zachowujemy pozostałe pola profilu (np. email, telefon zapisane przez EditProfile).
    writeJSON(KEYS.profile, { ...readJSON(KEYS.profile, {}), clinicName, profilePicture });
  };

  const username = "Janek"; // TODO: podpiąć pod logowanie

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="app-container">
        <Navbar clinicName={profile.clinicName} profilePicture={profile.profilePicture} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard username={username} />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/shopping-list" element={<ShoppingList clinicName={profile.clinicName} />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/product-list" element={<ProductList />} />
            <Route path="/offers" element={<Offers />} />
            <Route
              path="/edit-profile"
              element={
                <EditProfile
                  currentClinicName={profile.clinicName}
                  currentProfileImage={profile.profilePicture}
                  updateProfile={handleProfileUpdate}
                />
              }
            />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
