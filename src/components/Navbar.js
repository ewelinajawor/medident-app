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
  FaFileContract,
  FaBars,
  FaTimes
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = ({ clinicName, profilePicture }) => {
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
        {isOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* Profil użytkownika */}
      <div className="user-profile">
        <img src={profilePicture} alt="Profil" className="profile-picture" />
        <p className="clinic-name">{clinicName}</p>
      </div>

      {/* Linki nawigacji */}
      <ul className="nav-links">
        <li>
          <Link to="/dashboard" className="nav-item">
            <FaHome /> {isOpen && "Strona Główna"}
          </Link>
        </li>
        <li>
          <Link to="/inventory" className="nav-item">
            <FaBox /> {isOpen && "Magazyn"}
          </Link>
        </li>
        <li>
          <Link to="/notifications" className="nav-item">
            <FaBell /> {isOpen && "Powiadomienia"}
          </Link>
        </li>
        <li>
          <Link to="/settings" className="nav-item">
            <FaCog /> {isOpen && "Ustawienia"}
          </Link>
        </li>
        <li>
          <Link to="/product-list" className="nav-item">
            <FaClipboardList /> {isOpen && "Zapas"}
          </Link>
        </li>
        <li>
          <Link to="/suppliers" className="nav-item">
            <FaTruck /> {isOpen && "Dostawcy"}
          </Link>
        </li>
        <li>
          <Link to="/shopping-list" className="nav-item">
            <FaShoppingCart /> {isOpen && "Lista Zakupów"}
          </Link>
        </li>
        <li>
          <Link to="/offers" className="nav-item">
            <FaFileContract /> {isOpen && "Analizuj oferty"}
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
