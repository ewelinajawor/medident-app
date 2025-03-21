import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBox,
  FaBell,
  FaCog,
  FaClipboardList,
  FaTruck,
  FaShoppingCart,
  FaFileContract,
  FaBars,
  FaTimes,
  FaChevronRight
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const [profileData, setProfileData] = useState({
    clinicName: "Gabinet Medyczny",
    profilePicture: "https://via.placeholder.com/50"
  });

  // Pobranie danych profilu z localStorage
  useEffect(() => {
    const handleProfileUpdate = () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfileData({
          clinicName: parsedProfile.clinicName || "Gabinet Medyczny",
          profilePicture: parsedProfile.profilePicture || "https://via.placeholder.com/50"
        });
      }
    };

    // Wczytaj na początku
    handleProfileUpdate();

    // Nasłuchuj zmian w localStorage (dla przeglądarek obsługujących storage event)
    window.addEventListener('storage', handleProfileUpdate);

    // Nasłuchuj własnego zdarzenia (dla aktualizacji w tej samej karcie)
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Śledzenie zmian rozmiaru okna
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sprawdzenie, czy link jest aktywny
  const isLinkActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Struktura elementów nawigacji
  const navItems = [
    { path: "/dashboard", icon: <FaHome />, text: "Strona Główna" },
    { path: "/inventory", icon: <FaBox />, text: "Magazyn" },
    { path: "/notifications", icon: <FaBell />, text: "Powiadomienia" },
    { path: "/settings", icon: <FaCog />, text: "Ustawienia" },
    { path: "/product-list", icon: <FaClipboardList />, text: "Baza produktów" },
    { path: "/suppliers", icon: <FaTruck />, text: "Dostawcy" },
    { path: "/shopping-list", icon: <FaShoppingCart />, text: "Lista Zakupów" },
    { path: "/offers", icon: <FaFileContract />, text: "Analizuj oferty" },
  ];

  // Używamy hover tylko na większych ekranach
  const sidebarProps = isMobile
    ? {}
    : {
        onMouseEnter: () => setIsOpen(true),
        onMouseLeave: () => setIsOpen(false),
      };

  return (
    <nav
      className={`sidebar ${isOpen ? "open" : ""}`}
      {...sidebarProps}
    >
      {/* Przycisk do otwierania/zamykania menu */}
      <div className="menu-toggle" onClick={toggleMenu}>
        {isOpen ? <FaTimes /> : <FaBars />}
        {isOpen && <span className="toggle-text">Zwiń menu</span>}
      </div>

      {/* Profil użytkownika */}
      <div className="user-profile">
        <div className="profile-image-container">
          <img 
            src={profileData.profilePicture} 
            alt="Profil" 
            className="profile-pic" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/50";
            }}
          />
        </div>
        <div className="clinic-name">{profileData.clinicName}</div>
      </div>

      {/* Linki nawigacji */}
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className={`nav-item ${isLinkActive(item.path) ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {isOpen && (
                <>
                  <span className="nav-text">{item.text}</span>
                  <FaChevronRight className="chevron-icon" />
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {/* Wersja i prawa autorskie */}
      {isOpen && (
        <div className="sidebar-footer">
          <span>MediDent v1.0</span>
        </div>
      )}
    </nav>
  );
};

export default Navbar;