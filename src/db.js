const sql = require('mssql');

const config = {
  server: 'EWELINA', // Nazwa serwera
  database: 'Medident Magazyn', // Nazwa bazy danych
  options: {
    encrypt: true, // Zabezpieczenie połączenia
    trustServerCertificate: true, // Zaufanie do certyfikatu
  },
  authentication: {
    type: 'default', // Domyślna autentykacja Windows
  },
};

async function connectToDatabase() {
  try {
    await sql.connect(config);
    console.log('Połączenie z bazą danych zostało nawiązane.');
  } catch (err) {
    console.error('Błąd połączenia z bazą danych:', err);
  }
}

module.exports = { connectToDatabase, sql };
