# MediDent

Aplikacja do zarządzania zakupami i magazynem gabinetu stomatologicznego (React, Create React App).

## Uruchomienie

```bash
npm install
npm start        # http://localhost:3000
npm test         # testy (Jest)
npm run build    # wersja produkcyjna w katalogu build/
```

## Moduły

| Ekran | Opis |
|---|---|
| Strona główna | Podsumowanie magazynu, zamówień w toku, wydatków i kalendarz wydarzeń |
| Magazyn | Stan magazynu, przyjęcie i wydanie towaru, produkty dodane ręcznie |
| Baza produktów | Katalog ok. 11 tys. produktów (`public/dental_products.json`) |
| Lista zakupów | Budowanie listy, szablony, eksport CSV, złożenie zamówienia (otwiera e-mail do dostawców) |
| Zamówienia | Historia zamówień, zmiana statusu, przyjęcie dostawy na magazyn |
| Analizuj oferty | Porównanie ofert dostawców i składanie zamówień |
| Dostawcy | Lista dostawców (używana też na liście zakupów) |
| Wydatki (`/savings`) | Raport wydatków z historii zamówień |

## Dane

Na razie wszystkie dane są zapisywane w `localStorage` przeglądarki. Dostęp do nich jest w jednym miejscu: `src/utils/storage.js`.

Przepływ danych: **Baza produktów / Magazyn → Lista zakupów → Zamówienia → (dostawa) → Magazyn**.

Katalog `server/` zawiera eksperymentalny serwer Express + MS SQL (`npm run server`), z którego frontend jeszcze nie korzysta.
