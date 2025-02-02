import React, { useState, useEffect } from "react";
import "./Suppliers.css"; // Stylizacja tabeli dostawców

const Suppliers = ({ suppliers, setSuppliers }) => {
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    nip: "",
  });
  const [showForm, setShowForm] = useState(false); // Stan do pokazywania formularza

  // Obsługa zmiany w formularzu
  const handleInputChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  // Obsługa dodawania nowego dostawcy
  const addSupplier = () => {
    if (!newSupplier.name || !newSupplier.email || !newSupplier.phone || !newSupplier.nip) {
      alert("Wypełnij wszystkie pola!");
      return;
    }
    const newSupplierData = { id: suppliers.length + 1, ...newSupplier };
    const updatedSuppliers = [...suppliers, newSupplierData];
    setSuppliers(updatedSuppliers);  // Aktualizujemy dane dostawców w rodzicu
    setNewSupplier({ name: "", email: "", phone: "", nip: "" }); // Reset formularza
    setShowForm(false); // Zamknięcie formularza
  };

  return (
    <div className="suppliers-container">
      <h2>Lista dostawców</h2>
      <button className="add-supplier-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Anuluj" : "Dodaj dostawcę"}
      </button>

      {showForm && (
        <div className="supplier-form">
          <input
            type="text"
            name="name"
            placeholder="Nazwa"
            value={newSupplier.name}
            onChange={handleInputChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newSupplier.email}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="phone"
            placeholder="Telefon"
            value={newSupplier.phone}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="nip"
            placeholder="NIP"
            value={newSupplier.nip}
            onChange={handleInputChange}
          />
          <button onClick={addSupplier}>Dodaj</button>
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
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.nip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Suppliers;
