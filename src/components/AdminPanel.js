import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [autoGenerateSettings, setAutoGenerateSettings] = useState({
    enabled: false,
    dayOfWeek: "Monday",
    time: "08:00"
  });

  const activityLogs = [
    { date: "2025-02-08", user: "Test User", action: "Zalogowanie" },
    { date: "2025-02-08", user: "Test User", action: "Dodanie produktu" },
    { date: "2025-02-08", user: "Test User", action: "Usunięcie produktu" },
  ];

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", 
    "Friday", "Saturday", "Sunday"
  ];

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAutoGenerateSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const saveSettings = () => {
    // Tutaj dodaj logikę zapisywania ustawień do backendu
    console.log("Zapisano ustawienia:", autoGenerateSettings);
    alert("Ustawienia automatycznego generowania listy zostały zapisane!");
  };

  return (
    <div className="admin-container">
      <button className="back-button" onClick={() => navigate("/settings")}>
        ← Powrót do Ustawień
      </button>
      <h1 className="admin-title">Panel Administracyjny</h1>
      
      <div className="auto-generate-settings">
        <h2>Automatyczne generowanie listy zakupów</h2>
        
        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              name="enabled"
              checked={autoGenerateSettings.enabled}
              onChange={handleSettingsChange}
            />
            Włącz automatyczne generowanie
          </label>
        </div>
        
        {autoGenerateSettings.enabled && (
          <>
            <div className="setting-row">
              <label>Dzień tygodnia:</label>
              <select
                name="dayOfWeek"
                value={autoGenerateSettings.dayOfWeek}
                onChange={handleSettingsChange}
              >
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>
                    {day === "Monday" && "Poniedziałek"}
                    {day === "Tuesday" && "Wtorek"}
                    {day === "Wednesday" && "Środa"}
                    {day === "Thursday" && "Czwartek"}
                    {day === "Friday" && "Piątek"}
                    {day === "Saturday" && "Sobota"}
                    {day === "Sunday" && "Niedziela"}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="setting-row">
              <label>Godzina:</label>
              <input
                type="time"
                name="time"
                value={autoGenerateSettings.time}
                onChange={handleSettingsChange}
              />
            </div>
            
            <button 
              className="save-settings-button"
              onClick={saveSettings}
            >
              Zapisz ustawienia
            </button>
          </>
        )}
      </div>
      
      <h2 className="activity-log-title">Dziennik aktywności</h2>
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
  );
};

export default AdminPanel;