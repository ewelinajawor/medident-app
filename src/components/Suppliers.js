import React, { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import { FaPlus, FaPen, FaTrashAlt, FaSave, FaTimes } from "react-icons/fa";
import "./Suppliers.css";

const Suppliers = () => {
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    nip: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Funkcja do pobierania dostawców z localStorage
  const getStoredSuppliers = () => {
    const storedSuppliers = JSON.parse(localStorage.getItem('suppliers'));
    return storedSuppliers ? storedSuppliers : [];
  };

  // Funkcja do inicjalizacji dostawców z domyślnymi wartościami
  const initializeSuppliers = () => {
    const defaultSuppliers = [
      { id: Date.now(), name: "Koldental", email: "info@koldental.com.pl", phone: "+48 225146200", nip: "5241001593" },
      { id: Date.now() + 1, name: "Meditrans", email: "e-sklep@meditrans.pl", phone: "+48 413067122", nip: "6572896029" },
      { id: Date.now() + 2, name: "Marrodent", email: "marek.fajkis@marrodent.pl", phone: "+33 8152013", nip: "9372343899" },
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

    if (newSupplier.phone.includes("_") || newSupplier.phone.trim() === "+48 ---") {
      newErrors.phone = "Podaj pełny numer telefonu";
      isValid = false;
    }

    if (newSupplier.nip.includes("_") || newSupplier.nip.trim() === "---") {
      newErrors.nip = "Podaj prawidłowy NIP";
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
    } else {
      const newSupplierData = { id: Date.now(), ...newSupplier };
      updatedSuppliers.push(newSupplierData);
      setSuppliers(updatedSuppliers);
    }

    setNewSupplier({ name: "", email: "", phone: "", nip: "" });
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
    setNewSupplier({ name: "", email: "", phone: "", nip: "" });
    setErrors({});
    setFormSubmitted(false);
  };

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h2>Lista dostawców</h2>
        <button 
          className={`primary-btn ${showForm ? 'cancel-btn' : ''}`} 
          onClick={showForm ? cancelForm : () => setShowForm(true)}
        >
          {showForm ? (
            <>
              <FaTimes className="button-icon" /> Anuluj
            </>
          ) : (
            <>
              <FaPlus className="button-icon" /> Dodaj dostawcę
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="supplier-form-container">
          <div className="supplier-form">
            <div className="form-group">
              <label htmlFor="name">Nazwa</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={newSupplier.name} 
                onChange={handleInputChange} 
                className={formSubmitted && errors.name ? "error" : ""} 
              />
              {formSubmitted && errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={newSupplier.email} 
                onChange={handleInputChange} 
                className={formSubmitted && errors.email ? "error" : ""} 
              />
              {formSubmitted && errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefon</label>
              <InputMask 
                mask="+48 999-999-999" 
                id="phone" 
                name="phone" 
                value={newSupplier.phone} 
                onChange={handleInputChange} 
                className={formSubmitted && errors.phone ? "error" : ""} 
              />
              {formSubmitted && errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="nip">NIP</label>
              <InputMask 
                mask="999-999-99-99" 
                id="nip" 
                name="nip" 
                value={newSupplier.nip} 
                onChange={handleInputChange} 
                className={formSubmitted && errors.nip ? "error" : ""} 
              />
              {formSubmitted && errors.nip && <div className="error-message">{errors.nip}</div>}
            </div>

            <button className="primary-btn save-btn" onClick={addSupplier}>
              <FaSave className="button-icon" />
              {editingSupplier ? "Zapisz zmiany" : "Dodaj dostawcę"}
            </button>
          </div>
        </div>
      )}

      {suppliers.length === 0 ? (
        <div className="no-suppliers">
          <p>Brak dostawców do wyświetlenia.</p>
          <p>Kliknij "Dodaj dostawcę", aby dodać nowego dostawcę.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>NIP</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className={deleteConfirmation === supplier.id ? "delete-confirm-row" : ""}>
                  <td>{supplier.name}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.nip}</td>
                  <td>
                    {deleteConfirmation === supplier.id ? (
                      <div className="delete-confirmation">
                        <span>Potwierdź usunięcie</span>
                        <div className="confirmation-buttons">
                          <button className="confirm-btn" onClick={() => removeSupplier(supplier.id)}>Tak</button>
                          <button className="cancel-btn" onClick={cancelDelete}>Nie</button>
                        </div>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => editSupplier(supplier)}>
                          <FaPen className="button-icon" /> Edytuj
                        </button>
                        <button className="delete-btn" onClick={() => confirmDelete(supplier.id)}>
                          <FaTrashAlt className="button-icon" /> Usuń
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Suppliers;