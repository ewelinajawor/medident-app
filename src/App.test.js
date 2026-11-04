// Testy dymne: każda strona renderuje się bez błędów na prawdziwym pliku produktów.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from './App';

const products = require('../public/dental_products.json');

global.IS_REACT_ACT_ENVIRONMENT = true;
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
HTMLCanvasElement.prototype.getContext = () => null;

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  }
};

let errors;
beforeEach(() => {
  errors = [];
  jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.map(String).join(' ')));
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(products) }));
  localStorage.clear();
  localStorage.setItem('orderHistory', JSON.stringify([
    { date: '12.06.2025', time: '10:00', providers: 'Koldental', products: [{ name: 'Igły', quantity: 3, bestPrice: 2 }], totalCost: 6, notes: '' },
  ]));
  localStorage.setItem('inventoryStock', JSON.stringify([
    { id: 1, catalogId: 'catalog_0', name: 'Igły', category: 'Znieczulenia', quantity: 1, minStock: 5, unit: 'szt' },
  ]));
});
afterEach(() => console.error.mockRestore());

const renderAt = async (path) => {
  window.history.pushState({}, '', path);
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => root.render(<App />));
  await flush();
  return { div, root };
};

const relevant = () => errors.filter((e) => !/Failed to create chart|act\(|ReactDOMTestUtils|not wrapped in act/.test(e));

const routes = ['/', '/dashboard', '/inventory', '/notifications', '/settings', '/shopping-list', '/orders',
  '/suppliers', '/product-list', '/offers', '/edit-profile', '/admin-panel', '/savings', '/nie-istnieje'];

test.each(routes)('strona %s renderuje się bez błędów', async (path) => {
  const { div, root } = await renderAt(path);
  expect(div.textContent.length).toBeGreaterThan(50);
  expect(relevant()).toEqual([]);
  act(() => root.unmount());
});

test('Dashboard: wszystkie zakładki, w tym kalendarz, bez pętli renderowania', async () => {
  const { div, root } = await renderAt('/dashboard');
  for (const label of ['Magazyn', 'Zamówienia', 'Raporty', 'Kalendarz', 'Przegląd']) {
    const btn = [...div.querySelectorAll('.dashboard .tabs button')].find((b) => b.textContent.includes(label));
    // eslint-disable-next-line no-await-in-loop
    await act(async () => btn.click());
    // eslint-disable-next-line no-await-in-loop
    await flush();
  }
  expect(relevant().filter((e) => /Maximum update depth/.test(e))).toEqual([]);
  expect(relevant()).toEqual([]);
  act(() => root.unmount());
});

test('Baza produktów: wyszukiwanie nie wywraca strony, dodanie trafia na listę zakupów', async () => {
  const { div, root } = await renderAt('/product-list');
  const input = div.querySelector('.search-input');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setter.call(input, 'qqqzzz');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await flush();
  expect(div.textContent).toContain('Brak produktów');
  await act(async () => {
    setter.call(input, 'Lignox');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await flush();
  await act(async () => div.querySelector('.add-to-list-btn').click());
  expect(JSON.parse(localStorage.getItem('products'))[0].name).toMatch(/Lignox/);
  expect(relevant()).toEqual([]);
  act(() => root.unmount());
});

test('Zamówienia: stara data 12.06.2025 wyświetla się jako czerwiec', async () => {
  const { div, root } = await renderAt('/orders');
  expect(div.textContent).toMatch(/12 cze 2025/);
  act(() => root.unmount());
});
