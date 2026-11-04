import React, { useState, useEffect } from 'react';
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Package,
  Building2,
  Tag,
  X,
  SlidersHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './ProductList.css';
import { addToShoppingList, getPriceHistory } from '../utils/storage';
import { formatMoney } from '../utils/format';

const collator = new Intl.Collator('pl', { sensitivity: 'base', numeric: true });

/**
 * Historia cen produktu. Baza produktów pokazuje nazwy oczyszczone (bez „szt”, „op.”),
 * a lista zakupów zapisuje nazwy z pliku – dlatego sprawdzamy obie.
 */
const priceHistoryForProduct = (product) => {
  const names = new Set([product.name, product.rawName].filter(Boolean));
  return getPriceHistory()
    .filter((entry) => names.has(entry.name))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const formatShortDate = (value) =>
  new Date(value).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filters, setFilters] = useState({
    categories: [],
    suppliers: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickView, setShowQuickView] = useState(null);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products from JSON
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.PUBLIC_URL}/dental_products.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nie udało się załadować danych.");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const processedData = data.map((product) => ({
            ...product,
            rawName: product.name,
            // Oczyszczanie nazwy produktu
            name: product.name ? product.name.replace(/(N\/A\s(?:szt|op\.)|szt|op\.)/gi, "").trim() : "",
            // 145 produktów w bazie nie ma producenta – bez tego wyszukiwarka rzucała wyjątek.
            supplier: product.supplier || "Nieznany producent",
            category: product.category || "Inne",
          }));

          setProducts(processedData);
          setFilteredProducts(processedData);
        } else {
          throw new Error("Dane nie są tablicą.");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Get unique categories and suppliers
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean).sort();
  const suppliers = [...new Set(products.map(p => p.supplier))].filter(Boolean).sort();

  // Filter and sort products
  useEffect(() => {
    let result = [...products];

    // Search filter
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.supplier.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter(product => filters.categories.includes(product.category));
    }

    // Supplier filter
    if (filters.suppliers.length > 0) {
      result = result.filter(product => filters.suppliers.includes(product.supplier));
    }

    // Sort
    result.sort((a, b) => {
      const comparison = collator.compare(String(a[sortConfig.key] ?? ''), String(b[sortConfig.key] ?? ''));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ categories: [], suppliers: [] });
    setSearchTerm('');
  };

  const addToShoppingListHandler = (product) => {
    addToShoppingList({ name: product.name, category: product.category, price: product.price, quantity: 1 });
    setNotification(`Dodano „${product.name}” do listy zakupów.`);
    setTimeout(() => setNotification(''), 3000);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pluralProducts = (n) => {
    if (n === 1) return 'produkt';
    const lastDigit = n % 10;
    const lastTwo = n % 100;
    return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'produkty' : 'produktów';
  };

  const activeFilterCount = filters.categories.length + filters.suppliers.length;
  const hasFilters = searchTerm || activeFilterCount > 0;

  const formatPrice = (price) => (typeof price === 'number' && price > 0 ? `${formatMoney(price)}` : null);

  const ProductCard = ({ product }) => {
    const price = formatPrice(product.price);
    return (
      <article className="product-card">
        <h3 className="product-title" title={product.name}>{product.name}</h3>
        <p className="product-meta">
          <span>{product.supplier}</span>
          <span className="meta-sep" aria-hidden="true">·</span>
          <span>{product.category}</span>
        </p>
        <div className="product-card-footer">
          {price ? <span className="product-price num">{price}</span> : <span className="product-price muted">Brak ceny</span>}
          <div className="product-card-actions">
            <button
              onClick={() => setShowQuickView(product)}
              className="btn btn-ghost btn-sm icon-only"
              title="Szczegóły"
              aria-label={`Szczegóły: ${product.name}`}
            >
              <Eye />
            </button>
            <button
              onClick={() => addToShoppingListHandler(product)}
              className="add-to-list-btn btn btn-secondary btn-sm"
            >
              <Plus /> Do listy
            </button>
          </div>
        </div>
      </article>
    );
  };

  const SortHeader = ({ column, label }) => (
    <button onClick={() => handleSort(column)} className="sort-header">
      {label}
      {sortConfig.key === column && (
        <span className="sort-indicator" aria-hidden="true">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  const TableRow = ({ product }) => {
    const price = formatPrice(product.price);
    return (
      <tr>
        <td className="cell-name">{product.name}</td>
        <td className="muted">{product.supplier}</td>
        <td className="muted">{product.category}</td>
        <td className="right num">{price || '—'}</td>
        <td className="right">
          <div className="row-actions">
            <button
              onClick={() => setShowQuickView(product)}
              className="btn btn-ghost btn-sm icon-only"
              title="Szczegóły"
              aria-label={`Szczegóły: ${product.name}`}
            >
              <Eye />
            </button>
            <button
              onClick={() => addToShoppingListHandler(product)}
              className="add-to-list-btn btn btn-secondary btn-sm"
            >
              <Plus /> Do listy
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="product-list-page page">
        <header className="page-header">
          <h1 className="page-title">Baza produktów</h1>
        </header>
        <p className="muted">Ładowanie produktów…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-list-page page">
        <header className="page-header">
          <h1 className="page-title">Baza produktów</h1>
        </header>
        <div className="empty-state">
          <h4>Nie udało się wczytać produktów</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-list-page page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Baza produktów</h1>
          <p className="page-subtitle">Katalog materiałów używanych w gabinecie</p>
        </div>
      </header>

      <div className="toolbar">
        <div className="search-field">
          <Search className="search-field-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Szukaj po nazwie, producencie lub kategorii"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Szukaj produktów"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn btn-secondary ${showFilters ? 'is-active' : ''}`}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal /> Filtry
          {activeFilterCount > 0 && <span className="filter-count num">{activeFilterCount}</span>}
        </button>

        <div className="toolbar-end">
          <select
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split('-');
              setSortConfig({ key, direction });
            }}
            aria-label="Sortowanie"
          >
            <option value="name-asc">Nazwa A–Z</option>
            <option value="name-desc">Nazwa Z–A</option>
            <option value="supplier-asc">Producent A–Z</option>
            <option value="supplier-desc">Producent Z–A</option>
            <option value="category-asc">Kategoria A–Z</option>
            <option value="category-desc">Kategoria Z–A</option>
          </select>

          <div className="segmented" role="group" aria-label="Widok">
            <button
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'active' : ''}
              title="Widok kafelków"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid3X3 />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'active' : ''}
              title="Widok tabeli"
              aria-pressed={viewMode === 'table'}
            >
              <List />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card filters-panel">
          <div className="filter-group">
            <h3 className="section-label">Kategorie</h3>
            <div className="filter-list">
              {categories.map(category => (
                <label key={category} className="filter-item">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleFilterChange('categories', category)}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3 className="section-label">Producenci</h3>
            <div className="filter-list">
              {suppliers.map(supplier => (
                <label key={supplier} className="filter-item">
                  <input
                    type="checkbox"
                    checked={filters.suppliers.includes(supplier)}
                    onChange={() => handleFilterChange('suppliers', supplier)}
                  />
                  <span>{supplier}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters-footer">
            <button onClick={clearFilters} className="btn btn-ghost btn-sm" disabled={!hasFilters}>
              Wyczyść filtry
            </button>
          </div>
        </div>
      )}

      <div className="results-info">
        <span className="muted">
          Znaleziono <strong className="num">{filteredProducts.length}</strong> {pluralProducts(filteredProducts.length)}
        </span>
        <label className="per-page">
          <span className="muted">Na stronie</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
            <option value={96}>96</option>
          </select>
        </label>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-icon" aria-hidden="true" />
          <h4>Brak produktów</h4>
          <p>Nie znaleziono produktów spełniających kryteria wyszukiwania.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-secondary">
              Wyczyść filtry
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="products-grid">
          {currentProducts.map(product => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      ) : (
        <div className="card card-flush">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><SortHeader column="name" label="Nazwa produktu" /></th>
                  <th><SortHeader column="supplier" label="Producent" /></th>
                  <th><SortHeader column="category" label="Kategoria" /></th>
                  <th className="right">Cena</th>
                  <th aria-label="Akcje"></th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map(product => (
                  <TableRow key={product.product_id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Strony">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
            aria-label="Poprzednia strona"
          >
            <ChevronLeft />
          </button>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`page-btn num ${currentPage === pageNum ? 'active' : ''}`}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          <span className="page-total muted">z {totalPages}</span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="page-btn"
            aria-label="Następna strona"
          >
            <ChevronRight />
          </button>
        </nav>
      )}

      {showQuickView && (
        <div className="modal-backdrop" onClick={() => setShowQuickView(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-view-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="quick-view-title" className="modal-title">{showQuickView.name}</h2>
              <button
                onClick={() => setShowQuickView(null)}
                className="btn btn-ghost btn-sm icon-only"
                aria-label="Zamknij"
              >
                <X />
              </button>
            </div>

            <dl className="modal-facts">
              <dt><Building2 aria-hidden="true" /> Producent</dt>
              <dd>{showQuickView.supplier}</dd>
              <dt><Tag aria-hidden="true" /> Kategoria</dt>
              <dd>{showQuickView.category}</dd>
              {formatPrice(showQuickView.price) && (
                <>
                  <dt>Cena</dt>
                  <dd className="num">{formatPrice(showQuickView.price)}</dd>
                </>
              )}
            </dl>

            {(() => {
              const history = priceHistoryForProduct(showQuickView);
              if (history.length === 0) return null;
              const last = history[history.length - 1];
              const lowest = history.reduce((min, h) => (h.price < min.price ? h : min), history[0]);
              return (
                <section className="price-history" aria-labelledby="price-history-title">
                  <h3 id="price-history-title" className="section-label">Historia cen</h3>
                  <dl className="price-history-facts">
                    <div>
                      <dt>Ostatnia</dt>
                      <dd className="num">{formatMoney(last.price)}</dd>
                      <dd className="muted">{last.supplier}</dd>
                    </div>
                    <div>
                      <dt>Najniższa</dt>
                      <dd className="num">{formatMoney(lowest.price)}</dd>
                      <dd className="muted">{lowest.supplier}</dd>
                    </div>
                  </dl>
                  <div className="price-history-table">
                    <table>
                      <tbody>
                        {[...history].reverse().slice(0, 5).map((h, i) => (
                          <tr key={`${h.date}-${h.supplier}-${i}`}>
                            <td className="num muted">{formatShortDate(h.date)}</td>
                            <td>{h.supplier}</td>
                            <td className="right num">{formatMoney(h.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {history.length > 5 && (
                    <p className="muted price-history-more">
                      Pokazano 5 z {history.length}. Pełna historia w zakładce Raporty.
                    </p>
                  )}
                </section>
              );
            })()}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowQuickView(null)}>Zamknij</button>
              <button
                onClick={() => {
                  addToShoppingListHandler(showQuickView);
                  setShowQuickView(null);
                }}
                className="btn btn-primary"
              >
                <Plus /> Dodaj do listy zakupów
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="notice toast" role="status">
          {notification}
        </div>
      )}
    </div>
  );
};

export default ProductList;
