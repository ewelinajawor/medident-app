import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Camera, ArrowLeft } from "lucide-react";
import "./EditProfile.css";
import { DEFAULT_AVATAR } from "../utils/avatar";

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

  const [profilePicturePreview, setProfilePicturePreview] = useState(currentProfileImage || DEFAULT_AVATAR);

  // Stan dla powiadomienia
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  // Efekt do synchronizacji stanu lokalnego z propsami, jeśli te się zmienią
  // (np. jeśli dane zostaną zaktualizowane w innym miejscu i App.js prześle nowe propsy)
  useEffect(() => {
    setClinicNameInput(currentClinicName || "Nazwa Gabinetu");
    setProfilePicturePreview(currentProfileImage || DEFAULT_AVATAR);
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
    const pictureToSave = profilePicturePreview === DEFAULT_AVATAR ? null : profilePicturePreview;
    updateProfile(clinicNameInput, pictureToSave);

    // Jeśli email i phone mają być częścią 'userProfile' w localStorage,
    // to App.js powinien je również przyjmować w `handleProfileUpdate`
    // i zapisywać. Alternatywnie, można zostawić ich zapis tutaj,
    // ale to rozdziela logikę.
    // Dla spójności, App.js mógłby zarządzać całym obiektem userProfile.
    // Na razie, dla uproszczenia i skupienia się na clinicName i profilePicture,
    // zostawmy zapis email/phone tutaj.
    const fullProfileForStorage = {
        clinicName: clinicNameInput,
        profilePicture: pictureToSave,
        email: emailInput,
        phone: phoneInput
    };
    localStorage.setItem('userProfile', JSON.stringify(fullProfileForStorage));


    setNotification({
      show: true,
      type: "success",
      message: "Zapisano zmiany w profilu."
    });

    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  return (
    <div className="edit-profile page">
      <Link to="/settings" className="btn btn-ghost btn-sm ep-back">
        <ArrowLeft /> Ustawienia
      </Link>

      <header className="page-header">
        <div>
          <h1 className="page-title">Profil gabinetu</h1>
          <p className="page-subtitle">Te dane widać w menu i w treści zamówień wysyłanych do dostawców.</p>
        </div>
      </header>

      {notification.show && (
        <div className="notice" role="status">{notification.message}</div>
      )}

      <div className="card ep-card">
        <div className="ep-photo">
          <img
            src={profilePicturePreview}
            alt="Logo lub zdjęcie gabinetu"
            className="ep-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <div>
            <label htmlFor="profile-image-upload" className="btn btn-secondary btn-sm">
              <Camera /> Zmień zdjęcie
            </label>
            <input
              type="file"
              id="profile-image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="ep-file"
            />
            <p className="ep-hint">JPG lub PNG, najlepiej kwadratowe.</p>
          </div>
        </div>

        <div className="ep-fields">
          <div className="ep-field">
            <label htmlFor="ep-clinic">Nazwa gabinetu</label>
            <input
              id="ep-clinic"
              type="text"
              name="clinicName"
              value={clinicNameInput}
              onChange={(e) => setClinicNameInput(e.target.value)}
              placeholder="Nazwa gabinetu"
            />
          </div>

          <div className="ep-field">
            <label htmlFor="ep-email">E-mail</label>
            <input
              id="ep-email"
              type="email"
              name="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="kontakt@gabinet.pl"
            />
          </div>

          <div className="ep-field">
            <label htmlFor="ep-phone">Telefon</label>
            <input
              id="ep-phone"
              type="tel"
              name="phone"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+48 123 456 789"
            />
          </div>
        </div>

        <div className="ep-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Zapisz zmiany
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
