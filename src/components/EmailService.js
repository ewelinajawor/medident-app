// emailService.js
// Ten serwis obsługuje wysyłanie emaili z zamówieniami do dostawców

// W przyszłości będziemy używać EmailJS, SendGrid lub podobnej usługi
// Do integracji z EmailJS byłby potrzebny kod podobny do tego:
/*
import emailjs from 'emailjs-com';

// Inicjalizacja EmailJS (w głównym pliku aplikacji)
emailjs.init("YOUR_USER_ID");
*/

/**
 * Generuje unikalne ID dla formularza zamówienia
 * @returns {string} Unikalne ID zamówienia
 */
const generateOrderId = () => {
    return `ORD-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  };
  
  /**
   * Generuje unikalny token dostępu do formularza
   * @returns {string} Token dostępu
   */
  const generateAccessToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  /**
   * Zapisuje zamówienie w bazie danych
   * @param {Object} orderData Dane zamówienia
   * @param {string} accessToken Token dostępu
   * @returns {Object} Zapisane zamówienie
   */
  const saveOrderToDatabase = (orderData, accessToken) => {
    // W rzeczywistej aplikacji zapisalibyśmy to w bazie danych
    // Na potrzeby demonstracji zapisujemy w localStorage
  
    const savedOrders = JSON.parse(localStorage.getItem('sentOrdersData')) || {};
    const orderId = generateOrderId();
    
    const orderWithToken = {
      ...orderData,
      orderId,
      accessToken,
      status: 'Wysłane',
      sentDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      supplierChanges: []
    };
    
    savedOrders[orderId] = orderWithToken;
    localStorage.setItem('sentOrdersData', JSON.stringify(savedOrders));
    
    return orderWithToken;
  };
  
  /**
   * Wysyła email z linkiem do formularza zamówienia
   * @param {string} email Adres email odbiorcy
   * @param {string} supplierName Nazwa dostawcy
   * @param {Object} orderData Dane zamówienia
   * @returns {Promise} Promise z informacją o wysłaniu
   */
  const sendOrderEmail = async (email, supplierName, orderData) => {
    // Generujemy unikalny token dostępu dla tego zamówienia
    const accessToken = generateAccessToken();
    
    // Zapisujemy zamówienie w "bazie danych" wraz z tokenem
    const savedOrder = saveOrderToDatabase(orderData, accessToken);
    
    // Link do formularza edycji zamówienia
    // W rzeczywistym środowisku zastąpimy to pełnym URL (np. `https://example.com/order-form/${savedOrder.orderId}?token=${accessToken}`)
    const formLink = `/order-form/${savedOrder.orderId}?token=${accessToken}`;
    
    // Generujemy treść emaila
    const emailContent = generateOrderEmailHtml(savedOrder, formLink);
    
    // W trybie testowym (czyli teraz), pokazujemy w konsoli, co wysłalibyśmy
    console.log(`📧 Przygotowano email do ${supplierName} (${email})`);
    console.log(`Temat: Zamówienie nr ${savedOrder.orderId} od Gabinetu Dentystycznego`);
    console.log(`Link do formularza: ${formLink}`);
    
    // W rzeczywistej implementacji użylibyśmy np. EmailJS:
    /*
    try {
      await emailjs.send(
        "SERVICE_ID",  // ID serwisu
        "TEMPLATE_ID", // ID szablonu
        {
          to_email: email,
          supplier_name: supplierName,
          order_id: savedOrder.orderId,
          order_date: new Date(savedOrder.sentDate).toLocaleDateString(),
          delivery_date: orderData.deliveryDate || 'Jak najszybciej',
          products: JSON.stringify(savedOrder.products),
          total_cost: savedOrder.totalCost.toFixed(2),
          notes: savedOrder.notes || 'Brak uwag',
          form_link: formLink,
        }
      );
    } catch (error) {
      console.error("Błąd wysyłania emaila:", error);
      return {
        success: false,
        message: `Błąd podczas wysyłania emaila: ${error.message}`,
        orderId: savedOrder.orderId
      };
    }
    */
    
    // Symulujemy opóźnienie i sukces wysyłki
    return new Promise((resolve) => {
      setTimeout(() => {
        // Zapisujemy informację o wysłanym emailu
        const emailLogs = JSON.parse(localStorage.getItem('emailLogs')) || [];
        emailLogs.push({
          to: email,
          supplier: supplierName,
          subject: `Zamówienie nr ${savedOrder.orderId} od Gabinetu Dentystycznego`,
          sentDate: new Date().toISOString(),
          orderId: savedOrder.orderId,
          // Dodajemy pole wskazujące czy to email testowy czy rzeczywisty
          testMode: true
        });
        localStorage.setItem('emailLogs', JSON.stringify(emailLogs));
        
        resolve({
          success: true,
          message: `Email został przygotowany do wysłania do ${supplierName} (${email})`,
          orderId: savedOrder.orderId,
          formLink,
          // W przyszłości, gdy będziemy używać rzeczywistego systemu wysyłki:
          // testMode: false
          testMode: true
        });
      }, 1500); // Symulujemy opóźnienie 1.5 sekundy
    });
  };
  
  /**
   * Pobiera dane dostawców z adresami email
   * @returns {Array} Lista dostawców z adresami email
   */
  const getSupplierEmails = () => {
    // W rzeczywistej aplikacji pobieralibyśmy to z bazy danych
    return [
      { id: 1, name: "Koldental", email: "zamowienia@koldental.com" },
      { id: 2, name: "Meditrans", email: "testmeditrans@gmail.com" }, // Używamy testowego adresu
      { id: 3, name: "Marrodent", email: "zamowienia@marrodent.pl" }
    ];
  };
  
  /**
   * Generuje HTML dla emaila z zamówieniem
   * @param {Object} orderData Dane zamówienia
   * @param {string} formLink Link do formularza
   * @returns {string} HTML emaila
   */
  const generateOrderEmailHtml = (orderData, formLink) => {
    const productsHtml = orderData.products
      .map(product => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.category || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.price ? `${product.price.toFixed(2)} zł` : '0.00 zł'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${(product.quantity * (product.price || 0)).toFixed(2)} zł</td>
        </tr>
      `)
      .join('');
  
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2C3E50;">Zamówienie nr ${orderData.orderId}</h2>
        <p>Szanowni Państwo,</p>
        <p>Przesyłamy nowe zamówienie od naszego gabinetu. Prosimy o weryfikację i potwierdzenie realizacji.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #3498DB;">
          <h3 style="margin-top: 0; color: #2C3E50;">Szczegóły zamówienia:</h3>
          <p><strong>Data zamówienia:</strong> ${new Date(orderData.sentDate).toLocaleDateString()}</p>
          <p><strong>Preferowana data dostawy:</strong> ${orderData.deliveryDate || 'Jak najszybciej'}</p>
          ${orderData.notes ? `<p><strong>Uwagi do zamówienia:</strong> ${orderData.notes}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #2C3E50; color: white;">
              <th style="padding: 10px; text-align: left;">Produkt</th>
              <th style="padding: 10px; text-align: left;">Kategoria</th>
              <th style="padding: 10px; text-align: left;">Ilość</th>
              <th style="padding: 10px; text-align: left;">Cena jedn.</th>
              <th style="padding: 10px; text-align: left;">Suma</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="4" style="padding: 10px; text-align: right;">Razem:</td>
              <td style="padding: 10px;">${orderData.totalCost.toFixed(2)} zł</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${formLink}" style="display: inline-block; padding: 12px 24px; background-color: #3498DB; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Edytuj i potwierdź zamówienie
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Ten email został wygenerowany automatycznie przez system zarządzania zamówieniami MediDent.
          Prosimy nie odpowiadać na tę wiadomość.
        </p>
      </div>
    `;
  };
  
  // Eksportujemy funkcje
  export {
    sendOrderEmail,
    getSupplierEmails,
    generateOrderId,
    generateAccessToken,
    generateOrderEmailHtml
  };