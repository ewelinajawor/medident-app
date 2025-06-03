import React, { useState, useEffect } from "react";
import { FaUser, FaCamera, FaClinicMedical, FaEnvelope, FaPhone } from "react-icons/fa";
import "./EditProfile.css";

// Komponent przyjmuje aktualne dane profilu i funkcję do ich aktualizacji jako propsy
const EditProfile = ({ currentClinicName, currentProfileImage, updateProfile }) => {
  // Lokalny stan dla pól formularza, inicjalizowany propsami
  // Dla clinicName i profilePicturePreview używamy propsów
  // Email i phone są nadal zarządzane lokalnie w tym komponencie,
  // ponieważ App.js ich nie śledzi globalnie.
  // Jeśli App.js miałby je śledzić, przyszłyby również jako propsy.
  const [clinicNameInput, setClinicNameInput] = useState(currentClinicName || "Nazwa Gabinetu");
  const [emailInput, setEmailInput] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile'); // Możemy wczytać email/phone jednorazowo
    return savedProfile ? (JSON.parse(savedProfile).email || "kontakt@gabinet.pl") : "kontakt@gabinet.pl";
  });
  const [phoneInput, setPhoneInput] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? (JSON.parse(savedProfile).phone || "+48 123 456 789") : "+48 123 456 789";
  });

  const [profilePicturePreview, setProfilePicturePreview] = useState(currentProfileImage || "https://via.placeholder.com/150");

  // Stan dla powiadomienia
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  // Efekt do synchronizacji stanu lokalnego z propsami, jeśli te się zmienią
  // (np. jeśli dane zostaną zaktualizowane w innym miejscu i App.js prześle nowe propsy)
  useEffect(() => {
    setClinicNameInput(currentClinicName || "Nazwa Gabinetu");
    setProfilePicturePreview(currentProfileImage || "https://via.placeholder.com/150");
    // Dla email i phone, możemy zdecydować, czy mają być resetowane przez propsy,
    // jeśli App.js zacznie nimi zarządzać. Na razie pozostają niezależne po inicjalizacji.
  }, [currentClinicName, currentProfileImage]);


  // Obsługa zmiany zdjęcia
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Zapisanie zmian
  const handleSave = () => {
    // Wywołanie funkcji updateProfile przekazanej z App.js
    // Przekazujemy tylko te dane, którymi zarządza App.js (clinicName, profilePicture)
    // Email i phone są aktualizowane w localStorage bezpośrednio tutaj,
    // ponieważ App.js ich nie przekazuje.
    updateProfile(clinicNameInput, profilePicturePreview);

    // Jeśli email i phone mają być częścią 'userProfile' w localStorage,
    // to App.js powinien je również przyjmować w `handleProfileUpdate`
    // i zapisywać. Alternatywnie, można zostawić ich zapis tutaj,
    // ale to rozdziela logikę.
    // Dla spójności, App.js mógłby zarządzać całym obiektem userProfile.
    // Na razie, dla uproszczenia i skupienia się na clinicName i profilePicture,
    // zostawmy zapis email/phone tutaj.
    const fullProfileForStorage = {
        clinicName: clinicNameInput,
        profilePicture: profilePicturePreview,
        email: emailInput,
        phone: phoneInput
    };
    localStorage.setItem('userProfile', JSON.stringify(fullProfileForStorage));


    setNotification({
      show: true,
      type: "success",
      message: "Pomyślnie zaktualizowano profil!"
    });

    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  return (
    <div className="edit-profile-container">
      <h1 className="profile-title">
        <FaUser className="title-icon" /> Edytuj Profil
      </h1>

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="profile-form">
        <div className="profile-picture-section">
          <div className="profile-picture-container">
            <img
              src={profilePicturePreview}
              alt="Zdjęcie Profilowe"
              className="profile-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
            <label htmlFor="profile-image-upload" className="image-upload-btn">
              <FaCamera />
              <span>Zmień</span>
            </label>
            <input
              type="file"
              id="profile-image-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>
          <p className="image-hint">Kliknij na zdjęcie, aby zmienić</p>
        </div>

        <div className="profile-info-section">
          <div className="form-group">
            <label>
              <FaClinicMedical className="field-icon" />
              Nazwa Gabinetu
            </label>
            <input
              type="text"
              name="clinicName" // Nazwa pola w stanie
              value={clinicNameInput}
              onChange={(e) => setClinicNameInput(e.target.value)}
              placeholder="Nazwa Twojego gabinetu"
            />
          </div>

          <div className="form-group">
            <label>
              <FaEnvelope className="field-icon" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Adres email"
            />
          </div>

          <div className="form-group">
            <label>
              <FaPhone className="field-icon" />
              Telefon
            </label>
            <input
              type="tel"
              name="phone"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Numer telefonu"
            />
          </div>

          <button className="save-profile-btn" onClick={handleSave}>
            Zapisz zmiany
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;