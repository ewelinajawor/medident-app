import React from "react";

function HomePage({ username }) {
  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Witaj, {username}!</h1>
      <p className="homepage-text">Zarządzaj zakupami i magazynem w swojej placówce.</p>
      
      <div className="homepage-buttons">
        <button className="homepage-button">Lista zakupów</button>
        <button className="homepage-button">Magazyn</button>
        <button className="homepage-button">Dostawcy</button>
      </div>
    </div>
  );
}

export default HomePage;
