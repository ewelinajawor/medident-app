import React from "react";
import "./Settings.css"; // Import stylów CSS

const Settings = () => {
  return (
    <div className="settings-container">
      <h1 className="settings-title">Ustawienia</h1>
      <p className="settings-description">
        Zarządzaj swoim profilem i preferencjami aplikacji poniżej.
      </p>
      <div className="settings-options">
        <button className="settings-button">Edytuj Profil</button>
        <button className="settings-button">Zarządzaj Powiadomieniami</button>
        <button className="settings-button">Zmień Hasło</button>
      </div>
    </div>
  );
};

export default Settings;
