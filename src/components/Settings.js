import React, { useState, useEffect } from "react";
import "./Settings.css"; // Import stylów CSS

const Settings = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      // Tymczasowe dane, później zastąpisz API Azure
      const logs = [
        { date: "2025-02-08", user: "Test User", action: "Zalogowanie" },
        { date: "2025-02-08", user: "Test User", action: "Dodanie produktu" },
        { date: "2025-02-08", user: "Test User", action: "Usunięcie produktu" },
      ];
      setActivityLogs(logs);
    } catch (error) {
      console.error("Błąd podczas pobierania logów", error);
    }
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">Ustawienia</h1>
      <p className="settings-description">
        Zarządzaj swoim profilem i preferencjami aplikacji poniżej.
      </p>
      <div className="settings-options">
        <button className="settings-button" onClick={() => setShowAdminPanel(!showAdminPanel)}>
          Panel Administracyjny
        </button>
        <button className="settings-button">Edytuj Profil</button>
        <button className="settings-button">Zarządzaj Powiadomieniami</button>
        <button className="settings-button">Zmień Hasło</button>
      </div>
      
      {showAdminPanel && (
        <div className="admin-panel">
          <h2>Panel Administracyjny</h2>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Użytkownik</th>
                <th>Akcja</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log, index) => (
                <tr key={index}>
                  <td>{log.date}</td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Settings;
