import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Check } from "lucide-react";
import "./Suppliers.css";

const Suppliers = () => {
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    nip: "",
    address: "",
    contactPerson: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig] = useState({ key: 'name', direction: 'asc' });
  const [notification, setNotification] = useState('');

  // Funkcja do pobierania dostawców z localStorage
  const getStoredSuppliers = () => {
    const storedSuppliers = JSON.parse(localStorage.getItem('suppliers'));
    return storedSuppliers ? storedSuppliers : [];
  };

  // Funkcja do inicjalizacji dostawców z domyślnymi wartościami
  const initializeSuppliers = () => {
    const defaultSuppliers = [
      { 
        id: Date.now(), 
        name: "Koldental", 
        email: "info@koldental.com.pl", 
        phone: "+48 22 514 62 00", 
        nip: "524-100-15-93",
        address: "ul. Marszałkowska 15, 00-626 Warszawa",
        contactPerson: "Anna Kowalska"
      },
      { 
        id: Date.now() + 1, 
        name: "Meditrans", 
        email: "e-sklep@meditrans.pl", 
        phone: "+48 41 306 71 22", 
        nip: "657-289-60-29",
        address: "ul. Przemysłowa 8, 41-200 Sosnowiec",
        contactPerson: "Marek Nowak"
      },
      { 
        id: Date.now() + 2, 
        name: "Marrodent", 
        email: "marek.fajkis@marrodent.pl", 
        phone: "+48 33 815 20 13", 
        nip: "937-234-38-99",
        address: "ul. Dentystyczna 12, 42-600 Tarnowskie Góry",
        contactPerson: "Marek Fajkis"
      },
    ];
    localStorage.setItem('suppliers', JSON.stringify(defaultSuppliers));
    return defaultSuppliers;
  };

  // Inicjalizowanie dostawców z localStorage lub domyślnych danych
  const [suppliers, setSuppliers] = useState(() => {
    const storedSuppliers = getStoredSuppliers();
    if (storedSuppliers.length === 0) {
      return initializeSuppliers();
    }
    return storedSuppliers;
  });

  // Funkcja do zapisywania dostawców do localStorage
  const saveSuppliersToLocalStorage = (suppliersList) => {
    localStorage.setItem('suppliers', JSON.stringify(suppliersList));
  };

  useEffect(() => {
    saveSuppliersToLocalStorage(suppliers);
  }, [suppliers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier({ ...newSupplier, [name]: value });
    
    // Usuń błędy podczas edycji
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!newSupplier.name.trim()) {
      newErrors.name = "Nazwa jest wymagana";
      isValid = false;
    }

    if (!validateEmail(newSupplier.email)) {
      newErrors.email = "Podaj prawidłowy adres email";
      isValid = false;
    }

    if (!newSupplier.phone.trim()) {
      newErrors.phone = "Numer telefonu jest wymagany";
      isValid = false;
    }

    if (!newSupplier.nip.trim()) {
      newErrors.nip = "NIP jest wymagany";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const addSupplier = () => {
    setFormSubmitted(true);
    
    if (!validateForm()) {
      return;
    }

    const updatedSuppliers = [...suppliers];

    if (editingSupplier) {
      const index = updatedSuppliers.findIndex(supplier => supplier.id === editingSupplier.id);
      updatedSuppliers[index] = { ...editingSupplier, ...newSupplier };
      setSuppliers(updatedSuppliers);
      setEditingSupplier(null);
      setNotification('Zapisano zmiany dostawcy.');
    } else {
      const newSupplierData = { id: Date.now(), ...newSupplier };
      updatedSuppliers.push(newSupplierData);
      setSuppliers(updatedSuppliers);
      setNotification('Dodano dostawcę.');
    }

    setTimeout(() => setNotification(''), 3000);
    setNewSupplier({ name: "", email: "", phone: "", nip: "", address: "", contactPerson: "" });
    setShowForm(false);
    setFormSubmitted(false);
    setErrors({});
  };

  const confirmDelete = (id) => {
    setDeleteConfirmation(id);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const removeSupplier = (id) => {
    const updatedSuppliers = suppliers.filter((supplier) => supplier.id !== id);
    setSuppliers(updatedSuppliers);
    setDeleteConfirmation(null);
    setNotification('Usunięto dostawcę.');
    setTimeout(() => setNotification(''), 3000);
  };

  const editSupplier = (supplier) => {
    setNewSupplier({ ...supplier });
    setEditingSupplier(supplier);
    setShowForm(true);
    setErrors({});
    setFormSubmitted(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
    setNewSupplier({ name: "", email: "", phone: "", nip: "", address: "", contactPerson: "" });
    setErrors({});
    setFormSubmitted(false);
  };

  // Filtrowanie i sortowanie
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });


  const renderField = (id, label, { type = "text", placeholder, required = false, wide = false } = {}) => {
    const hasError = formSubmitted && errors[id];
    return (
      <div className={`sup-field ${wide ? "sup-field-wide" : ""}`}>
        <label htmlFor={id}>
          {label}
          {required && <span className="sup-required" aria-hidden="true"> *</span>}
        </label>
        <input
          type={type}
          id={id}
          name={id}
          value={newSupplier[id] || ""}
          onChange={handleInputChange}
          className={hasError ? "sup-input-error" : ""}
          placeholder={placeholder}
          aria-invalid={hasError ? "true" : undefined}
        />
        {hasError && <div className="sup-error">{errors[id]}</div>}
      </div>
    );
  };

  return (
    <div className="suppliers page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dostawcy</h1>
          <p className="page-subtitle">
            {suppliers.length} {suppliers.length === 1 ? "dostawca" : "dostawców"} – używani także na liście zakupów
          </p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus /> Dodaj dostawcę
          </button>
        )}
      </header>

      {notification && (
        <div className="notice" role="status">
          <Check size={16} /> {notification}
        </div>
      )}

      {showForm && (
        <section className="card sup-form" aria-labelledby="sup-form-title">
          <h2 id="sup-form-title" className="sup-form-title">
            {editingSupplier ? `Edycja: ${editingSupplier.name}` : "Nowy dostawca"}
          </h2>
          <div className="sup-form-grid">
            {renderField("name", "Nazwa firmy", { placeholder: "np. Koldental", required: true })}
            {renderField("contactPerson", "Osoba kontaktowa", { placeholder: "Imię i nazwisko" })}
            {renderField("email", "E-mail", { type: "email", placeholder: "kontakt@firma.pl", required: true })}
            {renderField("phone", "Telefon", { type: "tel", placeholder: "+48 123 456 789", required: true })}
            {renderField("nip", "NIP", { placeholder: "123-456-78-90", required: true })}
            {renderField("address", "Adres", { placeholder: "ul. Przykładowa 123, 00-000 Miasto" })}
          </div>
          <div className="sup-form-actions">
            <button className="btn btn-secondary" onClick={cancelForm}>Anuluj</button>
            <button className="btn btn-primary" onClick={addSupplier}>
              {editingSupplier ? "Zapisz zmiany" : "Dodaj dostawcę"}
            </button>
          </div>
        </section>
      )}

      <div className="sup-toolbar">
        <div className="sup-search">
          <Search className="sup-search-icon" size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Szukaj po nazwie, e-mailu lub osobie…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Szukaj dostawców"
          />
        </div>
        {searchTerm && (
          <span className="muted">
            Znaleziono {filteredSuppliers.length} {filteredSuppliers.length === 1 ? "dostawcę" : "dostawców"}
          </span>
        )}
      </div>

      {sortedSuppliers.length === 0 ? (
        <div className="empty-state">
          <h3>{searchTerm ? "Brak wyników" : "Brak dostawców"}</h3>
          <p>
            {searchTerm
              ? "Spróbuj wpisać inną frazę."
              : "Dodaj pierwszego dostawcę, aby móc wysyłać do niego zamówienia."}
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="btn btn-secondary">
              Wyczyść wyszukiwanie
            </button>
          )}
        </div>
      ) : (
        <ul className="sup-list">
          {sortedSuppliers.map((supplier) => (
            <li key={supplier.id} className="card sup-card">
              {deleteConfirmation === supplier.id ? (
                <div className="sup-confirm">
                  <AlertTriangle className="sup-confirm-icon" size={18} aria-hidden="true" />
                  <div>
                    <p className="sup-confirm-text">
                      Usunąć dostawcę <strong>{supplier.name}</strong>? Tej operacji nie można cofnąć.
                    </p>
                    <div className="sup-card-actions">
                      <button className="btn btn-danger btn-sm" onClick={() => removeSupplier(supplier.id)}>
                        <Trash2 /> Usuń
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelDelete}>
                        Anuluj
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sup-card-head">
                    <div className="sup-card-title">
                      <h3>{supplier.name}</h3>
                      {supplier.contactPerson && <span className="muted">{supplier.contactPerson}</span>}
                    </div>
                    <div className="sup-card-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => editSupplier(supplier)}>
                        <Pencil /> Edytuj
                      </button>
                      <button
                        className="btn btn-ghost btn-sm sup-delete"
                        onClick={() => confirmDelete(supplier.id)}
                        aria-label={`Usuń ${supplier.name}`}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>

                  <dl className="sup-details">
                    <div>
                      <dt>E-mail</dt>
                      <dd><a href={`mailto:${supplier.email}`}>{supplier.email}</a></dd>
                    </div>
                    <div>
                      <dt>Telefon</dt>
                      <dd className="num">{supplier.phone}</dd>
                    </div>
                    <div>
                      <dt>NIP</dt>
                      <dd className="num">{supplier.nip}</dd>
                    </div>
                    {supplier.address && (
                      <div className="sup-details-wide">
                        <dt>Adres</dt>
                        <dd>{supplier.address}</dd>
                      </div>
                    )}
                  </dl>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Suppliers;
