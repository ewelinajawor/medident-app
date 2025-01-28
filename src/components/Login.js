// components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Importowanie pliku CSS dla logowania

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Prosta weryfikacja logowania
    if (username === 'admin' && password === 'admin') {
      // Przekierowanie na dashboard po udanym logowaniu
      navigate('/dashboard');
    } else {
      setError('Niepoprawny login lub hasło');
    }
  };

  return (
    <div className="login">
      <h2>Logowanie</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Użytkownik:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Hasło:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Zaloguj się</button>
        <button type="button" className="forgot-password">Nie pamiętam hasła</button>
      </form>
    </div>
  );
}

export default Login;
