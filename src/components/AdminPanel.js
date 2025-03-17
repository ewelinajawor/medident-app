import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();

  const activityLogs = [
    { date: "2025-02-08", user: "Test User", action: "Zalogowanie" },
    { date: "2025-02-08", user: "Test User", action: "Dodanie produktu" },
    { date: "2025-02-08", user: "Test User", action: "Usunięcie produktu" },
  ];

  return (
    <div className="admin-container">
      <button className="back-button" onClick={() => navigate("/settings")}>
        ← Powrót do Ustawień
      </button>
      <h1 className="admin-title">Panel Administracyjny</h1>
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
