import React, { useState, useEffect, useCallback } from "react";
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
  FaChevronRight,
  FaSignOutAlt
} from "react-icons/fa";
import "./Navbar.css";

// Przyjmujemy clinicName i profilePicture jako propsy
const Navbar = ({ clinicName, profilePicture }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  // Usunięto stan profileData oraz useEffect do synchronizacji z localStorage
  // Dane profilu (clinicName, profilePicture) są teraz przekazywane jako propsy

  // Śledzenie zmian rozmiaru okna z debouncingiem
  useEffect(() => {
    const debounce = (func, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
        }, delay);
      };
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const debouncedHandleResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedHandleResize);
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, []);

  const isLinkActive = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    console.log("Użytkownik wylogowany");
    // TODO: Implement actual logout logic (e.g., clear tokens, redirect)
  };

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

  const sidebarInteractionProps = isMobile
    ? {}
    : {
        onMouseEnter: () => setIsOpen(true),
        onMouseLeave: () => setIsOpen(false),
      };

  // Domyślny obrazek, jeśli profilePicture nie zostanie przekazany lub jest null/undefined
  const displayProfilePicture = profilePicture || "https://via.placeholder.com/50";
  // Domyślna nazwa kliniki, jeśli clinicName nie zostanie przekazany
  const displayClinicName = clinicName || "Gabinet Medyczny";


  return (
    <nav
      className={`sidebar ${isOpen ? "open" : ""}`}
      {...sidebarInteractionProps}
    >
      <div
        className="menu-toggle"
        onClick={toggleMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMenu(); }}
        aria-expanded={isOpen}
        aria-controls="nav-links-list"
        aria-label={isOpen ? "Zwiń menu" : "Rozwiń menu"}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
        {isOpen && !isMobile && <span className="toggle-text">Zwiń menu</span>}
      </div>

      <div className="user-profile">
        <div className="profile-image-container">
          <img
            src={displayProfilePicture} // Używamy propsa (z fallbackiem)
            alt="Profil"
            className="profile-pic"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/50"; // Ostateczny fallback
            }}
          />
        </div>
        {/* Używamy propsa (z fallbackiem) */}
        {isOpen && <div className="clinic-name">{displayClinicName}</div>}
      </div>

      <ul className="nav-links" id="nav-links-list">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-item ${isLinkActive(item.path) ? "active" : ""}`}
              title={!isOpen ? item.text : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {isOpen && (
                <>
                  <span className="nav-text">{item.text}</span>
                  <FaChevronRight className="chevron-icon" aria-hidden="true" />
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        {isOpen && (
          <div className="footer-content-open">
            <button onClick={handleLogout} className="logout-button nav-item" title="Wyloguj">
              <span className="nav-icon"><FaSignOutAlt /></span>
              <span className="nav-text">Wyloguj</span>
            </button>
            <div className="app-version">
              <span>MediDent v1.0</span>
            </div>
          </div>
        )}
        {!isOpen && (
          <button onClick={handleLogout} className="logout-button-collapsed nav-item" title="Wyloguj">
            <span className="nav-icon"><FaSignOutAlt /></span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;