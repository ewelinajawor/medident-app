const sql = require('mssql');

// Funkcja łącząca z bazą danych
async function connectToDatabase() {
  try {
    await sql.connect({
      server: 'localhost',  // lub IP, jeśli masz zdalny serwer
      database: 'Medident Magazyn',
      options: {
        encrypt: true, // Jeśli używasz SSL
        trustServerCertificate: true, // Użyj, jeśli masz problemy z certyfikatami
      },
      authentication: {
        type: 'ntlm',  // Windows Authentication
      }
    });
    console.log('Połączono z bazą danych!');
  } catch (error) {
    console.error('Błąd połączenia z bazą:', error);
  }
}

// Funkcja do wykonywania zapytań
async function getProducts() {
  try {
    const result = await sql.query('SELECT * FROM Baza_EJ_CSV');
    return result.recordset; // Zwróci dane
  } catch (error) {
    console.error('Błąd zapytania:', error);
  }
}

module.exports = { connectToDatabase, getProducts }; // Eksportujemy funkcje
