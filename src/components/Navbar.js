import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaBox,
  FaBell,
  FaCog,
  FaClipboardList,
  FaTruck,
  FaShoppingCart,
  FaTooth,
  FaFileContract, // Dodano ikonę dla ofert
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav
      className={`sidebar ${isOpen ? "open" : ""}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Przycisk do otwierania/zamykania menu */}
      <div className="menu-toggle" onClick={toggleMenu}>
        {isOpen ? "✕" : "☰"}
      </div>

      {/* Logo */}
      <div className="logo">
        <FaTooth size={24} />
      </div>

      {/* Linki nawigacji */}
      <ul className="nav-links">
        <li>
          <Link to="/dashboard" className="nav-item" data-tooltip="Strona Główna">
            <FaHome /> {isOpen && "Strona Główna"}
          </Link>
        </li>
        <li>
          <Link to="/inventory" className="nav-item" data-tooltip="Magazyn">
            <FaBox /> {isOpen && "Magazyn"}
          </Link>
        </li>
        <li>
          <Link to="/notifications" className="nav-item" data-tooltip="Powiadomienia">
            <FaBell /> {isOpen && "Powiadomienia"}
          </Link>
        </li>
        <li>
          <Link to="/settings" className="nav-item" data-tooltip="Ustawienia">
            <FaCog /> {isOpen && "Ustawienia"}
          </Link>
        </li>
        <li>
          <Link to="/product-list" className="nav-item" data-tooltip="Zapas">
            <FaClipboardList /> {isOpen && "Zapas"}
          </Link>
        </li>
        <li>
          <Link to="/suppliers" className="nav-item" data-tooltip="Dostawcy">
            <FaTruck /> {isOpen && "Dostawcy"}
          </Link>
        </li>
        <li>
          <Link to="/shopping-list" className="nav-item" data-tooltip="Lista Zakupów">
            <FaShoppingCart /> {isOpen && "Lista Zakupów"}
          </Link>
        </li>
        <li>
          <Link to="/offers" className="nav-item" data-tooltip="Analizuj oferty">
            <FaFileContract /> {isOpen && "Analizuj oferty"}
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;