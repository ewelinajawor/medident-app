import React from "react";
import { useNavigate } from "react-router-dom"; 
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="settings-container">
      <h1 className="settings-title">Ustawienia</h1>
      <p className="settings-description">
        Zarządzaj swoim profilem i preferencjami aplikacji poniżej.
      </p>

      <div className="settings-grid">
        <div className="settings-tile" onClick={() => navigate("/admin-panel")}>
          Panel Administracyjny
        </div>
        <div className="settings-tile" onClick={() => navigate("/edit-profile")}>
          Edytuj Profil
        </div>
        <div className="settings-tile">Zarządzaj Powiadomieniami</div>
        <div className="settings-tile">Zmień Hasło</div>
      </div>
    </div>
  );
};

export default Settings;
