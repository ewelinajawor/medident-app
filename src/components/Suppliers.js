import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Building2, 
  Mail, 
  Phone, 
  Hash,
  Search,
  Filter,
  ChevronDown,
  AlertTriangle,
  Check
} from "lucide-react";
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
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

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
      setNotification('Dostawca został zaktualizowany!');
    } else {
      const newSupplierData = { id: Date.now(), ...newSupplier };
      updatedSuppliers.push(newSupplierData);
      setSuppliers(updatedSuppliers);
      setNotification('Nowy dostawca został dodany!');
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
    setNotification('Dostawca został usunięty!');
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

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
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

  if (loading) {
    return (
      <div className="suppliers-loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie dostawców...</p>
      </div>
    );
  }

  return (
    <div className="suppliers-container">
      {/* Header */}
      <div className="suppliers-header">
        <div className="header-title">
          <Building2 className="header-icon" />
          <h1>Lista Dostawców</h1>
          <span className="suppliers-count">{suppliers.length}</span>
        </div>
        <div className="header-actions">
          <button 
            className={`add-supplier-btn ${showForm ? 'cancel-mode' : ''}`} 
            onClick={showForm ? cancelForm : () => setShowForm(true)}
          >
            {showForm ? (
              <>
                <X className="icon" /> Anuluj
              </>
            ) : (
              <>
                <Plus className="icon" /> Dodaj dostawcę
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="suppliers-controls">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Szukaj dostawców..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="results-info">
          Znaleziono <span className="count">{filteredSuppliers.length}</span> {
            filteredSuppliers.length === 1 ? 'dostawcę' : 'dostawców'
          }
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="supplier-form-container">
          <div className="form-header">
            <h3>{editingSupplier ? 'Edytuj dostawcę' : 'Dodaj nowego dostawcę'}</h3>
          </div>
          
          <div className="supplier-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  <Building2 className="label-icon" />
                  Nazwa firmy *
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={newSupplier.name} 
                  onChange={handleInputChange} 
                  className={formSubmitted && errors.name ? "error" : ""} 
                  placeholder="Np. Koldental"
                />
                {formSubmitted && errors.name && <div className="error-message">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="contactPerson">
                  Osoba kontaktowa
                </label>
                <input 
                  type="text" 
                  id="contactPerson" 
                  name="contactPerson" 
                  value={newSupplier.contactPerson} 
                  onChange={handleInputChange} 
                  placeholder="Imię i nazwisko"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  <Mail className="label-icon" />
                  Email *
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={newSupplier.email} 
                  onChange={handleInputChange} 
                  className={formSubmitted && errors.email ? "error" : ""} 
                  placeholder="kontakt@firma.pl"
                />
                {formSubmitted && errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <Phone className="label-icon" />
                  Telefon *
                </label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  value={newSupplier.phone} 
                  onChange={handleInputChange} 
                  className={formSubmitted && errors.phone ? "error" : ""} 
                  placeholder="+48 123 456 789"
                />
                {formSubmitted && errors.phone && <div className="error-message">{errors.phone}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nip">
                  <Hash className="label-icon" />
                  NIP *
                </label>
                <input 
                  type="text" 
                  id="nip" 
                  name="nip" 
                  value={newSupplier.nip} 
                  onChange={handleInputChange} 
                  className={formSubmitted && errors.nip ? "error" : ""} 
                  placeholder="123-456-78-90"
                />
                {formSubmitted && errors.nip && <div className="error-message">{errors.nip}</div>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">
                  Adres
                </label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  value={newSupplier.address} 
                  onChange={handleInputChange} 
                  placeholder="ul. Przykładowa 123, 00-000 Miasto"
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={addSupplier}>
                <Save className="icon" />
                {editingSupplier ? "Zapisz zmiany" : "Dodaj dostawcę"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers List */}
      {sortedSuppliers.length === 0 ? (
        <div className="empty-state">
          <Building2 className="empty-icon" />
          <h3>
            {searchTerm ? 'Brak wyników wyszukiwania' : 'Brak dostawców'}
          </h3>
          <p>
            {searchTerm 
              ? 'Spróbuj zmienić kryteria wyszukiwania.' 
              : 'Kliknij "Dodaj dostawcę", aby dodać pierwszego dostawcę.'
            }
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-btn">
              Wyczyść wyszukiwanie
            </button>
          )}
        </div>
      ) : (
        <div className="suppliers-list">
          {sortedSuppliers.map((supplier) => (
            <div key={supplier.id} className={`supplier-card ${deleteConfirmation === supplier.id ? 'delete-mode' : ''}`}>
              {deleteConfirmation === supplier.id ? (
                <div className="delete-confirmation">
                  <AlertTriangle className="warning-icon" />
                  <div className="confirmation-content">
                    <h4>Potwierdź usunięcie</h4>
                    <p>Czy na pewno chcesz usunąć dostawcę <strong>{supplier.name}</strong>?</p>
                    <div className="confirmation-actions">
                      <button className="confirm-delete-btn" onClick={() => removeSupplier(supplier.id)}>
                        <Trash2 className="icon" />
                        Usuń
                      </button>
                      <button className="cancel-delete-btn" onClick={cancelDelete}>
                        <X className="icon" />
                        Anuluj
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="supplier-header">
                    <div className="supplier-name">
                      <Building2 className="supplier-icon" />
                      <h3>{supplier.name}</h3>
                    </div>
                    <div className="supplier-actions">
                      <button className="edit-btn" onClick={() => editSupplier(supplier)}>
                        <Edit className="icon" />
                        Edytuj
                      </button>
                      <button className="delete-btn" onClick={() => confirmDelete(supplier.id)}>
                        <Trash2 className="icon" />
                        Usuń
                      </button>
                    </div>
                  </div>

                  <div className="supplier-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <Mail className="detail-icon" />
                        <div>
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{supplier.email}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <Phone className="detail-icon" />
                        <div>
                          <span className="detail-label">Telefon</span>
                          <span className="detail-value">{supplier.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <Hash className="detail-icon" />
                        <div>
                          <span className="detail-label">NIP</span>
                          <span className="detail-value">{supplier.nip}</span>
                        </div>
                      </div>
                      {supplier.contactPerson && (
                        <div className="detail-item">
                          <div>
                            <span className="detail-label">Osoba kontaktowa</span>
                            <span className="detail-value">{supplier.contactPerson}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {supplier.address && (
                      <div className="detail-row">
                        <div className="detail-item full-width">
                          <div>
                            <span className="detail-label">Adres</span>
                            <span className="detail-value">{supplier.address}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="notification">
          <Check className="notification-icon" />
          {notification}
        </div>
      )}
    </div>
  );
};

export default Suppliers;