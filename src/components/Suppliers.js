import React, { useState, useEffect } from "react";
import InputMask from "react-input-mask";
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
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zAz0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const addSupplier = () => {
    if (!newSupplier.name || !validateEmail(newSupplier.email) || newSupplier.phone.includes("_") || newSupplier.nip.includes("_")) {
      alert("Wypełnij wszystkie pola poprawnie!");
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
  };

  const removeSupplier = (id) => {
    const updatedSuppliers = suppliers.filter((supplier) => supplier.id !== id);
    setSuppliers(updatedSuppliers);
  };

  const editSupplier = (supplier) => {
    setNewSupplier({ ...supplier });
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  return (
    <div className="suppliers-container">
      <h2>Lista dostawców</h2>
      <button className="primary-btn" onClick={() => {
        setShowForm(!showForm);
        setEditingSupplier(null);
        setNewSupplier({ name: "", email: "", phone: "", nip: "" });
      }}>
        {showForm ? "Anuluj" : "Dodaj dostawcę"}
      </button>

      {showForm && (
        <div className="supplier-form">
          <input type="text" name="name" placeholder="Nazwa" value={newSupplier.name} onChange={handleInputChange} />

          <input type="email" name="email" placeholder="Email" value={newSupplier.email} onChange={handleInputChange} className={validateEmail(newSupplier.email) ? "" : "error"} />

          <InputMask mask="+48 999-999-999" name="phone" placeholder="Telefon" value={newSupplier.phone} onChange={handleInputChange} />

          <InputMask mask="999-999-99-99" name="nip" placeholder="NIP" value={newSupplier.nip} onChange={handleInputChange} />

          <button className="primary-btn" onClick={addSupplier}>
            {editingSupplier ? "Zapisz zmiany" : "Dodaj"}
          </button>
        </div>
      )}

      {suppliers.length === 0 ? (
        <p>Brak dostawców do wyświetlenia.</p>
      ) : (
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
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.nip}</td>
                <td>
                  <button className="edit-btn" onClick={() => editSupplier(supplier)}>Edytuj</button>
                  <button className="delete-btn" onClick={() => removeSupplier(supplier.id)}>Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Suppliers;
