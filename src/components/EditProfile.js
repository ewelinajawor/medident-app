import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Hook do nawigacji
import InputMask from "react-input-mask";
import "./EditProfile.css";

function EditProfile({ userData = {}, onUpdate }) {
  const navigate = useNavigate(); // Hook do nawigacji

  const [clinicName, setClinicName] = useState(userData.clinicName || "");
  const [nip, setNip] = useState(userData.nip || "");
  const [regon, setRegon] = useState(userData.regon || "");
  const [address, setAddress] = useState(userData.address || "");
  const [city, setCity] = useState(userData.city || "");
  const [postalCode, setPostalCode] = useState(userData.postalCode || "");
  const [bankAccount, setBankAccount] = useState(userData.bankAccount || "");
  const [profileImage, setProfileImage] = useState(userData.profileImage || null);
  const [showNotification, setShowNotification] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Sprawdza, czy dane zostały zmienione
  useEffect(() => {
    setIsModified(
      clinicName !== userData.clinicName ||
      nip !== userData.nip ||
      regon !== userData.regon ||
      address !== userData.address ||
      city !== userData.city ||
      postalCode !== userData.postalCode ||
      bankAccount !== userData.bankAccount ||
      profileImage !== userData.profileImage
    );
  }, [clinicName, nip, regon, address, city, postalCode, bankAccount, profileImage, userData]);

  // Obsługa zmiany zdjęcia profilowego
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Obsługa zapisu danych
  const handleSave = () => {
    const updatedData = { clinicName, nip, regon, address, city, postalCode, bankAccount, profileImage };
    if (onUpdate) onUpdate(updatedData);

    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      navigate("/settings"); // Po zapisaniu wraca do ustawień
    }, 1500);
  };

  // Powrót do ekranu ustawień
  const handleCancel = () => {
    navigate("/settings");
  };

  return (
    <div className="edit-profile-container">
      <h2>Edytuj profil</h2>

      {/* Zdjęcie profilowe */}
      <div className="profile-image-container">
        <label htmlFor="profileImageInput" className="profile-image-label">
          {profileImage ? (
            <img src={profileImage} alt="Profil" className="profile-image" />
          ) : (
            <div className="default-profile-icon">👤</div>
          )}
        </label>
        <input id="profileImageInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
        <label htmlFor="profileImageInput" className="upload-button">Wybierz zdjęcie</label>
      </div>

      {/* Formularz */}
      <div className="form-container">
        <div className="input-group">
          <label>Nazwa gabinetu</label>
          <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Wpisz nazwę gabinetu" />
        </div>

        <div className="input-group">
          <label>NIP</label>
          <InputMask mask="999-999-99-99" value={nip} onChange={(e) => setNip(e.target.value)} placeholder="Wpisz NIP" />
        </div>

        <div className="input-group">
          <label>REGON</label>
          <InputMask mask="999999999" value={regon} onChange={(e) => setRegon(e.target.value)} placeholder="Wpisz REGON" />
        </div>

        <div className="input-group">
          <label>Adres</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Wpisz adres" />
        </div>

        <div className="input-group">
          <label>Miasto</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Wpisz miasto" />
        </div>

        <div className="input-group">
          <label>Kod pocztowy</label>
          <InputMask mask="99-999" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Wpisz kod pocztowy" />
        </div>

        <div className="input-group">
          <label>Konto bankowe</label>
          <InputMask mask="99 9999 9999 9999 9999 9999 9999" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Wpisz nr konta" />
        </div>
      </div>

      {/* Przyciski */}
      <div className="button-group">
        <button className="save-button" onClick={handleSave} disabled={!isModified}>
          Zapisz zmiany
        </button>
        <button className="cancel-button" onClick={handleCancel}>
          Wróć do ekranu ustawień
        </button>
      </div>

      {/* Powiadomienie */}
      {showNotification && <div className="notification">✅ Zapisano zmiany!</div>}
    </div>
  );
}

export default EditProfile;
