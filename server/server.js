const express = require('express');
const sql = require('mssql');
const app = express();
const port = 5001;

// Konfiguracja połączenia z bazą danych
const config = {
  server: 'localhost', // lub 127.0.0.1 (jeśli nie działa 'Ewelina')
  database: 'Medident Magazyn',
  options: {
    encrypt: false, // Możesz spróbować ustawić na false, jeśli były problemy
    trustServerCertificate: true, // Umożliwia zaufanie certyfikatowi serwera
  },
  authentication: {
    type: 'ntlm',
    options: {
      userName: '', // Używamy Windows Authentication, więc puste
      password: '',
      domain: '',
    },
  },
};

// Funkcja obsługująca połączenie z bazą danych
const connectToDatabase = async () => {
  try {
    await sql.connect(config);
    console.log('Połączenie z bazą danych udane!');
  } catch (err) {
    console.error(`Błąd połączenia z bazą danych: ${err.message}`);
    throw new Error(`Błąd połączenia z bazą danych: ${err.message}`);
  }
};

// Testowy endpoint połączenia z bazą danych
app.get('/test-connection', async (req, res) => {
  console.log('Testowanie połączenia z bazą danych...');
  try {
    await connectToDatabase();
    console.log('Połączenie z bazą danych udane!');
    res.send('Połączenie z bazą danych udane!');
  } catch (err) {
    console.error('Błąd połączenia z bazą danych:', err.message);
    res.status(500).send('Nie udało się połączyć z bazą danych: ' + err.message); // Wysłać pełny komunikat błędu
  }
});

// Testowy endpoint sprawdzania dostępu do bazy
app.get('/check-database-access', async (req, res) => {
  console.log('Sprawdzanie dostępu do bazy danych...');
  try {
    await connectToDatabase();
    const result = await sql.query`SELECT @@VERSION AS version`;
    if (result.recordset.length === 0) {
      res.status(404).send('Brak danych o wersji bazy danych');
    } else {
      res.json(result.recordset[0]);
    }
  } catch (err) {
    console.error(`Błąd podczas sprawdzania dostępu do bazy danych: ${err.message}`);
    res.status(500).send('Błąd podczas sprawdzania dostępu do bazy danych: ' + err.message); // Pełny komunikat
  }
});

// Endpoint pobierania danych
app.get('/FetchData', async (req, res) => {
  console.log('Pobieranie danych z bazy...');
  try {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM Baza_EJ_CSV`;
    if (!result.recordset || result.recordset.length === 0) {
      res.status(404).send('Brak danych');
    } else {
      res.json(result.recordset);
    }
  } catch (err) {
    console.error(`Błąd zapytania do bazy danych: ${err.message}`);
    res.status(500).send('Błąd podczas pobierania danych: ' + err.message); // Pełny komunikat
  }
});

// Obsługa nieznanych błędów aplikacji
app.use((err, req, res, next) => {
  console.error('Nieznany błąd aplikacji:', err.message);
  res.status(500).send('Wystąpił błąd serwera: ' + err.message); // Pełny komunikat
});

app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});
