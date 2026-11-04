import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
    alert("Zapisano ustawienia automatycznej listy zakupów.");
  };

  const dayLabels = {
    Monday: "Poniedziałek",
    Tuesday: "Wtorek",
    Wednesday: "Środa",
    Thursday: "Czwartek",
    Friday: "Piątek",
    Saturday: "Sobota",
    Sunday: "Niedziela"
  };

  return (
    <div className="admin-panel page">
      <button className="btn btn-ghost btn-sm ap-back" onClick={() => navigate("/settings")}>
        <ArrowLeft /> Ustawienia
      </button>

      <header className="page-header">
        <div>
          <h1 className="page-title">Panel administracyjny</h1>
          <p className="page-subtitle">Automatyzacja listy zakupów i historia działań w aplikacji.</p>
        </div>
      </header>

      <section className="card ap-card">
        <h2 className="ap-card-title">Automatyczna lista zakupów</h2>
        <p className="muted ap-card-desc">
          W wybrany dzień aplikacja przygotuje listę zakupów z produktów poniżej minimalnego stanu.
        </p>

        <label className="ap-toggle">
          <input
            type="checkbox"
            name="enabled"
            checked={autoGenerateSettings.enabled}
            onChange={handleSettingsChange}
          />
          Włącz automatyczne generowanie
        </label>

        {autoGenerateSettings.enabled && (
          <>
            <div className="ap-fields">
              <div className="ap-field">
                <label htmlFor="ap-day">Dzień tygodnia</label>
                <select
                  id="ap-day"
                  name="dayOfWeek"
                  value={autoGenerateSettings.dayOfWeek}
                  onChange={handleSettingsChange}
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>{dayLabels[day]}</option>
                  ))}
                </select>
              </div>

              <div className="ap-field">
                <label htmlFor="ap-time">Godzina</label>
                <input
                  id="ap-time"
                  type="time"
                  name="time"
                  value={autoGenerateSettings.time}
                  onChange={handleSettingsChange}
                />
              </div>
            </div>

            <div className="ap-actions">
              <button className="btn btn-primary" onClick={saveSettings}>
                Zapisz ustawienia
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card ap-log">
        <h2 className="ap-card-title ap-log-title">Dziennik aktywności</h2>
        <div className="ap-table-wrap">
          <table>
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
                  <td className="num">{log.date}</td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
