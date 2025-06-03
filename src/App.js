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
import Savings from "./components/Savings";
import "./App.css";

function App() {
  // Stan dla danych profilowych
  const [clinicName, setClinicName] = useState("Dentica Plus"); // Domyślna nazwa kliniki
  const [profileImage, setProfileImage] = useState(null); // Domyślny obrazek profilowy (może być URL do placeholdera)

  // useEffect do wczytywania danych profilu z localStorage przy starcie aplikacji
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setClinicName(parsedProfile.clinicName || "Dentica Plus");
      // Używamy 'profilePicture' jako klucza w localStorage, zgodnie z tym, co robił Navbar
      setProfileImage(parsedProfile.profilePicture || null);
    }
  }, []);

  // Funkcja do aktualizacji danych profilowych i zapisu w localStorage
  const handleProfileUpdate = (newClinicName, newProfileImage) => {
    setClinicName(newClinicName);
    setProfileImage(newProfileImage);
    localStorage.setItem('userProfile', JSON.stringify({
      clinicName: newClinicName,
      profilePicture: newProfileImage // Zapisujemy pod kluczem 'profilePicture'
    }));
    // Jeśli inne komponenty potrzebowałyby natychmiastowej reakcji na zmianę localStorage
    // w tej samej karcie (a nie są potomkami App i nie otrzymują propsów),
    // można by tu wywołać window.dispatchEvent(new Event('profileUpdated'));
    // ale przy obecnej strukturze przekazywania propsów, nie jest to konieczne.
  };


  // Reszta stanów aplikacji
  const [username] = useState("Janek"); // To może też pochodzić z danych profilowych
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: "Koldental", email: "info@koldental.com.pl", phone: "+48 225146200", nip: "5241001593" },
    { id: 2, name: "Meditrans", email: "e-sklep@meditrans.pl", phone: "+48 413067122", nip: "6572896029" },
    { id: 3, name: "Marrodent", email: "marek.fajkis@marrodent.pl", phone: "+33 8152013", nip: "9372343899" },
  ]);
  const [shoppingList, setShoppingList] = useState([]);

  const addToShoppingList = (product) => {
    setShoppingList(prevList => [...prevList, product]);
  };

  // Logika pokazywania stopki (z wcześniejszych sugestii - bardziej React-way)
  const [shouldShowFooter, setShouldShowFooter] = useState(false);
  useEffect(() => {
    const checkScroll = () => {
      const appContainerElement = document.querySelector('.app-container');
      if (appContainerElement && appContainerElement.scrollHeight > window.innerHeight) {
        setShouldShowFooter(true);
      } else {
        setShouldShowFooter(false);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    // TODO: Rozważ dodanie obserwatora (np. MutationObserver lub ResizeObserver na .main-content)
    // aby wywołać checkScroll po dynamicznych zmianach treści, które wpływają na wysokość.

    return () => {
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  return (
    <Router>
      <div className={`app-container ${shouldShowFooter ? 'show-footer' : ''}`}>
        {/* Przekazujemy clinicName i profileImage (jako profilePicture) do Navbar */}
        <Navbar clinicName={clinicName} profilePicture={profileImage} />
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
              element={
                <EditProfile
                  currentClinicName={clinicName} // Przekazujemy aktualne wartości
                  currentProfileImage={profileImage}
                  updateProfile={handleProfileUpdate} // Przekazujemy jedną funkcję do aktualizacji
                />
              }
            />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/savings" element={<Savings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;