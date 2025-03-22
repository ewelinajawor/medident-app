import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { sendOrderEmail, getSupplierEmails } from '../services/emailService';
import './EmailSender.css';

const EmailSender = ({ orderData, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [sentResults, setSentResults] = useState([]);
  const [useRealEmails, setUseRealEmails] = useState(false);
  
  // Pobierz listę dostawców
  useEffect(() => {
    const suppliersList = getSupplierEmails();
    const supplierOptions = suppliersList.map(supplier => ({
      value: supplier.id,
      label: supplier.name,
      email: supplier.email
    }));
    setSuppliers(supplierOptions);
    
    // Automatycznie wybierz dostawców, jeśli są określeni w danych zamówienia
    if (orderData.selectedProviders && orderData.selectedProviders.length > 0) {
      const initialSuppliers = orderData.selectedProviders.map(name => {
        return supplierOptions.find(s => s.label === name) || null;
      }).filter(Boolean);
      
      setSelectedSuppliers(initialSuppliers);
    }
  }, [orderData]);
  
  const handleSupplierChange = (selected) => {
    setSelectedSuppliers(selected || []);
  };
  
  const handleSendEmails = async () => {
    if (selectedSuppliers.length === 0) {
      setError('Proszę wybrać co najmniej jednego dostawcę.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSentResults([]);
    
    const results = [];
    
    for (const supplier of selectedSuppliers) {
      try {
        const email = supplier.email;
        const supplierName = supplier.label;
        
        // Przygotuj dane zamówienia
        const orderToSend = {
          ...orderData,
          selectedProviders: [supplierName], // Ograniczamy do aktualnego dostawcy
          // Dodajemy pola, które mogą się przydać w formularzu zamówienia
          totalCost: calculateTotalCost(orderData.products),
          deliveryDate: orderData.deliveryDate || null,
          notes: orderData.notes || ''
        };
        
        // Wysyłamy zamówienie emailem
        const result = await sendOrderEmail(email, supplierName, orderToSend);
        
        results.push({
          supplier: supplierName,
          email,
          success: true,
          orderId: result.orderId,
          message: result.message,
          formLink: result.formLink,
          testMode: result.testMode
        });
      } catch (err) {
        results.push({
          supplier: supplier.label,
          email: supplier.email,
          success: false,
          message: err.message || 'Wystąpił nieznany błąd podczas wysyłania emaila.'
        });
      }
    }
    
    setSentResults(results);
    setLoading(false);
    
    // Jeśli wszystkie zamówienia zostały wysłane pomyślnie
    if (results.every(r => r.success)) {
      setSuccess(true);
      
      // Po 3 sekundach powiadom rodzica o sukcesie
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(results);
        }
      }, 3000);
    }
  };
  
  const calculateTotalCost = (products) => {
    return products.reduce((total, product) => total + (product.quantity * (product.price || 0)), 0);
  };
  
  // Jeśli proces się zakończył, pokaż podsumowanie
  if (success) {
    return (
      <div className="email-sender-success">
        <h2>✅ Zamówienia zostały wysłane!</h2>
        <p>Wysłano zamówienia do następujących dostawców:</p>
        
        <ul className="supplier-result-list">
          {sentResults.map((result, index) => (
            <li key={index} className="supplier-result-item">
              <div className="supplier-result-info">
                <span className="supplier-name">{result.supplier}</span>
                <span className="supplier-email">{result.email}</span>
              </div>
              <div className="supplier-result-status">
                <span className="order-id">Zamówienie ID: {result.orderId}</span>
                {result.testMode && (
                  <span className="test-mode-badge">Tryb testowy</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        <div className="email-sender-actions">
          <button 
            className="close-button" 
            onClick={onClose}
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="email-sender-container">
      <h2>Wyślij zamówienie emailem</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label>Wybierz dostawców:</label>
        <Select
          options={suppliers}
          isMulti
          onChange={handleSupplierChange}
          value={selectedSuppliers}
          placeholder="Wybierz dostawców..."
          className="supplier-select"
          noOptionsMessage={() => "Brak dostępnych dostawców"}
        />
      </div>
      
      <div className="order-summary">
        <h3>Podsumowanie zamówienia</h3>
        <div className="summary-details">
          <div className="summary-item">
            <span className="summary-label">Liczba produktów:</span>
            <span className="summary-value">{orderData.products.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Łączna wartość:</span>
            <span className="summary-value">{calculateTotalCost(orderData.products).toFixed(2)} zł</span>
          </div>
          {orderData.notes && (
            <div className="summary-item notes">
              <span className="summary-label">Uwagi:</span>
              <span className="summary-value">{orderData.notes}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Opcje wysyłki */}
      <div className="email-options">
        <label className="email-option">
          <input 
            type="checkbox" 
            checked={useRealEmails} 
            onChange={() => setUseRealEmails(!useRealEmails)}
          />
          <span>Użyj rzeczywistych adresów email</span>
          <span className="option-info">
            {useRealEmails ? 
              "Emaile zostaną wysłane na rzeczywiste adresy dostawców." : 
              "Emaile zostaną tylko zasymulowane (tryb testowy)."}
          </span>
        </label>
      </div>
      
      {/* Wyniki wysyłania (jeśli są) */}
      {sentResults.length > 0 && (
        <div className="sending-results">
          <h3>Wyniki wysyłania</h3>
          <ul className="results-list">
            {sentResults.map((result, index) => (
              <li key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                <span className="result-icon">{result.success ? '✓' : '✗'}</span>
                <div className="result-details">
                  <span className="result-supplier">{result.supplier}</span>
                  <span className="result-message">{result.message}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="email-sender-actions">
        <button 
          className="cancel-button" 
          onClick={onClose}
          disabled={loading}
        >
          Anuluj
        </button>
        <button 
          className="send-button" 
          onClick={handleSendEmails}
          disabled={loading || selectedSuppliers.length === 0}
        >
          {loading ? 'Wysyłanie...' : 'Wyślij zamówienia'}
        </button>
      </div>
    </div>
  );
};

export default EmailSender;