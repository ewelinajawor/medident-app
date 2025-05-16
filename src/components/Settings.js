import React from "react";
import { useNavigate } from "react-router-dom"; 
import { FaUserShield, FaUserEdit, FaBell, FaLock, FaCog, FaUsers } from "react-icons/fa";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  const settingsOptions = [
    {
      id: 1,
      title: "Panel Administracyjny",
      icon: <FaUserShield />,
      onClick: () => navigate("/admin-panel"),
      description: "Zarządzaj użytkownikami i ustawieniami systemu"
    },
    {
      id: 2,
      title: "Uprawnienia użytkowników",
      icon: <FaUsers />,
      onClick: () => navigate("/permissions"),
      description: "Przydzielaj role i kontroluj dostęp do funkcji"
    },
    {
      id: 3,
      title: "Edytuj Profil",
      icon: <FaUserEdit />,
      onClick: () => navigate("/edit-profile"),
      description: "Aktualizuj swoje dane osobowe i kontaktowe"
    },
    {
      id: 4,
      title: "Zarządzaj Powiadomieniami",
      icon: <FaBell />,
      onClick: () => console.log("Powiadomienia"),
      description: "Dostosuj preferencje powiadomień email i aplikacji"
    },
    {
      id: 5,
      title: "Zmień Hasło",
      icon: <FaLock />,
      onClick: () => console.log("Zmiana hasła"),
      description: "Aktualizuj swoje hasło i ustawienia bezpieczeństwa"
    }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <FaCog className="settings-icon" />
        <h1 className="settings-title">Ustawienia</h1>
      </div>
      
      <p className="settings-description">
        Zarządzaj swoim profilem, uprawnieniami i preferencjami aplikacji poniżej.
      </p>

      <div className="settings-grid">
        {settingsOptions.map((option) => (
          <div 
            key={option.id}
            className="settings-tile" 
            onClick={option.onClick}
          >
            <div className="settings-tile-icon">
              {option.icon}
            </div>
            <h3 className="settings-tile-title">{option.title}</h3>
            <p className="settings-tile-description">{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
