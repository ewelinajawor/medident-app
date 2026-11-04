import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  BookOpen,
  Scale,
  Truck,
  Bell,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X
} from "lucide-react";
import "./Navbar.css";
import { DEFAULT_AVATAR } from "../utils/avatar";
import { buildNotifications, getReadNotificationIds } from "../utils/notifications";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { path: "/dashboard", icon: LayoutDashboard, text: "Strona główna" },
      { path: "/inventory", icon: Package, text: "Magazyn" },
      { path: "/shopping-list", icon: ShoppingCart, text: "Lista zakupów" },
      { path: "/orders", icon: Receipt, text: "Zamówienia" },
    ],
  },
  {
    label: "Zakupy",
    items: [
      { path: "/product-list", icon: BookOpen, text: "Baza produktów" },
      { path: "/offers", icon: Scale, text: "Zapytania ofertowe" },
      { path: "/suppliers", icon: Truck, text: "Dostawcy" },
      { path: "/savings", icon: BarChart3, text: "Raporty" },
    ],
  },
  {
    label: "Konto",
    items: [
      { path: "/notifications", icon: Bell, text: "Powiadomienia", badge: "notifications" },
      { path: "/settings", icon: Settings, text: "Ustawienia", also: ["/admin-panel", "/edit-profile"] },
    ],
  },
];

const Navbar = ({ clinicName, profilePicture }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);

  // Na telefonie menu zamyka się po przejściu na inną stronę.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Licznik nieprzeczytanych powiadomień – przeliczany przy zmianie strony i po oznaczeniu jako przeczytane.
  useEffect(() => {
    const recount = () => {
      const read = getReadNotificationIds();
      setUnreadCount(buildNotifications().filter((n) => !read.includes(n.id)).length);
    };
    recount();
    window.addEventListener("notifications-changed", recount);
    window.addEventListener("storage", recount);
    return () => {
      window.removeEventListener("notifications-changed", recount);
      window.removeEventListener("storage", recount);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    // TODO: logowanie nie jest jeszcze zaimplementowane
    console.log("Użytkownik wylogowany");
  };

  const displayClinicName = clinicName || "Gabinet";

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="topbar-menu"
          onClick={() => setIsOpen(true)}
          aria-label="Otwórz menu"
          aria-expanded={isOpen}
          aria-controls="sidebar"
        >
          <Menu size={20} />
        </button>
        <span className="brand-name">MediDent</span>
      </header>

      {isOpen && <div className="sidebar-scrim" onClick={() => setIsOpen(false)} aria-hidden="true" />}

      <nav id="sidebar" className={`sidebar ${isOpen ? "open" : ""}`} aria-label="Menu główne">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span className="brand-name">MediDent</span>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setIsOpen(false)}
            aria-label="Zamknij menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-groups">
          {NAV_GROUPS.map((group, index) => (
            <div className="nav-group" key={group.label || index}>
              {group.label && <div className="nav-group-label">{group.label}</div>}
              <ul className="nav-links">
                {group.items.map(({ path, icon: Icon, text, also = [], badge }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      className={({ isActive }) =>
                        `nav-item ${isActive || also.includes(location.pathname) ? "active" : ""}`
                      }
                    >
                      <Icon className="nav-icon" size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>{text}</span>
                      {badge === "notifications" && unreadCount > 0 && (
                        <span className="nav-badge" aria-label={`${unreadCount} nieprzeczytanych`}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <NavLink to="/edit-profile" className="sidebar-profile" title="Edytuj profil">
            <img
              src={profilePicture || DEFAULT_AVATAR}
              alt=""
              className="profile-pic"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_AVATAR;
              }}
            />
            <span className="profile-text">
              <span className="clinic-name">{displayClinicName}</span>
              <span className="profile-hint">Edytuj profil</span>
            </span>
          </NavLink>
          <button type="button" onClick={handleLogout} className="logout-button" title="Wyloguj">
            <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">Wyloguj</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
