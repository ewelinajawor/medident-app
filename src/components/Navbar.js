import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Import stylu

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">MedidentApp</div>
      <ul className="nav-links">
        <li><Link to="/dashboard" className="nav-item">Strona Główna</Link></li>
        <li><Link to="/inventory" className="nav-item">Magazyn</Link></li>
        <li><Link to="/notifications" className="nav-item">Powiadomienia</Link></li>
        <li><Link to="/settings" className="nav-item">Ustawienia</Link></li>
        <li><Link to="/product-list" className="nav-item">Zapas</Link></li>
        <li><Link to="/suppliers" className="nav-item">Dostawcy</Link></li>
        <li><Link to="/shopping-list" className="nav-item">Lista Zakupów</Link></li> {/* Nowa zakładka */}
      </ul>
    </nav>
  );
};

export default Navbar;
