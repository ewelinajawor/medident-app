import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Import stylu

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">DentalApp</div>
      <ul className="nav-links">
        <li><Link to="/dashboard" className="nav-item">Strona Główna</Link></li>
        <li><Link to="/inventory" className="nav-item">Magazyn</Link></li>
        <li><Link to="/notifications" className="nav-item">Powiadomienia</Link></li>
        <li><Link to="/settings" className="nav-item">Ustawienia</Link></li>
        <li><Link to="/product-list" className="nav-item">Zapas</Link></li> {/* Dodany link do zapasów */}
      </ul>
    </nav>
  );
};

export default Navbar;
