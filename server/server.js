const express = require('express');
const sql = require('mssql');
const app = express();
const port = 5000;

// Konfiguracja połączenia z SQL Server
const config = {
    user: 'EWELINA/jawor', // Zastąp swoją nazwą użytkownika Windows
    server: 'EWELINA', // Nazwa serwera
    database: 'Medident Magazyn', // Nazwa bazy danych
    options: {
        trustedConnection: true, // Używaj uwierzytelniania Windows
        encrypt: false // Wyłącz szyfrowanie (można włączyć, jeśli wymagane)
    }
};

// Endpoint do pobierania danych z tabeli Baza_EJ_CSV
app.get('/api/products', async (req, res) => {
    try {
        // Połączenie z bazą danych
        await sql.connect(config);
        const result = await sql.query('SELECT * FROM Baza_EJ_CSV'); // Zapytanie SQL
        res.json(result.recordset); // Zwróć dane jako JSON
    } catch (err) {
        console.error('Błąd podczas pobierania danych:', err);
        res.status(500).send('Wystąpił błąd podczas pobierania danych');
    }
});

// Uruchom serwer
app.listen(port, () => {
    console.log(`Serwer działa na http://localhost:${port}`);
});