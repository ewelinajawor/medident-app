import {
  KEYS,
  readJSON,
  mergeIntoList,
  addToShoppingList,
  normalizeOrder,
  appendOrder,
  getOrders,
  receiveOrderIntoInventory,
  getSuppliers,
  DEFAULT_SUPPLIERS,
  buildOrderEmail,
} from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('lista zakupów', () => {
  test('mergeIntoList dodaje nowy produkt', () => {
    const list = mergeIntoList([], { name: 'Rękawice', category: 'Ochrona', quantity: 2 });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: 'Rękawice', quantity: 2, category: 'Ochrona' });
  });

  test('mergeIntoList zwiększa ilość bez mutowania oryginału', () => {
    const original = [{ name: 'Rękawice', quantity: 1 }];
    const result = mergeIntoList(original, { name: 'Rękawice', quantity: 3 });
    expect(result[0].quantity).toBe(4);
    expect(original[0].quantity).toBe(1);
  });

  test('addToShoppingList zapisuje w tym samym kluczu, z którego czyta Lista Zakupów', () => {
    addToShoppingList({ name: 'Maseczki', quantity: 1 });
    addToShoppingList({ name: 'Maseczki', quantity: 2 });
    expect(readJSON(KEYS.shoppingList, [])).toEqual([
      expect.objectContaining({ name: 'Maseczki', quantity: 3 }),
    ]);
  });
});

describe('zamówienia', () => {
  test('normalizeOrder obsługuje stary format z Listy Zakupów', () => {
    const legacy = {
      date: '12.06.2025',
      providers: 'Koldental, Meditrans',
      products: [{ name: 'Amalgam', quantity: 2, bestPrice: 10 }],
      totalCost: 20,
      notes: 'pilne',
    };
    const order = normalizeOrder(legacy, 3);
    expect(order).toMatchObject({
      id: 'legacy_3',
      supplier: 'Koldental, Meditrans',
      status: 'W realizacji',
      amount: 20,
      notes: 'pilne',
    });
    expect(order.items).toEqual([{ name: 'Amalgam', quantity: 2, price: 10, category: undefined }]);
    // 12.06.2025 to 12 czerwca, a nie 6 grudnia
    const date = new Date(order.date);
    expect([date.getDate(), date.getMonth() + 1, date.getFullYear()]).toEqual([12, 6, 2025]);
  });

  test('normalizeOrder jest idempotentne (zapis i ponowny odczyt nie zmienia daty)', () => {
    const once = normalizeOrder({ date: '03.02.2025, 14:30:00', products: [] });
    const twice = normalizeOrder(once);
    expect(twice.date).toBe(once.date);
    expect(new Date(once.date).getHours()).toBe(14);
  });

  test('normalizeOrder obsługuje format z Ofert ({ product, quantity })', () => {
    const order = normalizeOrder({
      supplierName: 'Marrodent',
      products: [{ product: { name: 'Żel', price: 28 }, quantity: 3 }],
    });
    expect(order.supplier).toBe('Marrodent');
    expect(order.items[0]).toMatchObject({ name: 'Żel', quantity: 3, price: 28 });
    expect(order.amount).toBe(84);
  });

  test('appendOrder dopisuje zamówienie do historii', () => {
    appendOrder({ supplier: 'Koldental', items: [{ name: 'Igły', quantity: 5, price: 2 }] });
    const orders = getOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ supplier: 'Koldental', status: 'W realizacji', amount: 10 });
    expect(new Date(orders[0].date).getTime()).not.toBeNaN();
  });

  test('receiveOrderIntoInventory zwiększa stan istniejącej pozycji i dodaje nowe', () => {
    localStorage.setItem(
      KEYS.inventory,
      JSON.stringify([{ id: 1, name: 'Igły', quantity: 2, minStock: 5 }])
    );
    receiveOrderIntoInventory({
      supplier: 'Koldental',
      items: [
        { name: 'Igły', quantity: 10 },
        { name: 'Wałeczki', quantity: 4 },
      ],
    });
    const stock = readJSON(KEYS.inventory, []);
    expect(stock.find((s) => s.name === 'Igły').quantity).toBe(12);
    expect(stock.find((s) => s.name === 'Wałeczki')).toMatchObject({ quantity: 4, minStock: 5 });
  });
});

describe('pozostałe', () => {
  test('getSuppliers zwraca domyślnych dostawców, gdy nic nie zapisano', () => {
    expect(getSuppliers()).toEqual(DEFAULT_SUPPLIERS);
  });

  test('getSuppliers zwraca dostawców z ekranu Dostawcy', () => {
    localStorage.setItem(KEYS.suppliers, JSON.stringify([{ id: 9, name: 'Nowy' }]));
    expect(getSuppliers()).toEqual([{ id: 9, name: 'Nowy' }]);
  });

  test('readJSON nie wywraca aplikacji przy uszkodzonych danych', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(KEYS.orderHistory, '{zepsute');
    expect(readJSON(KEYS.orderHistory, [])).toEqual([]);
    console.error.mockRestore();
  });

  test('buildOrderEmail zawiera pozycje i uwagi', () => {
    const body = buildOrderEmail({
      clinicName: 'Dentica Plus',
      items: [{ name: 'Igły', quantity: 5 }],
      notes: 'Dostawa do 12:00',
    });
    expect(body).toContain('Dentica Plus');
    expect(body).toContain('1. Igły — 5 szt.');
    expect(body).toContain('Uwagi: Dostawa do 12:00');
  });
});
