import React, { useState, useEffect } from "react";
import { FaUser, FaCamera, FaClinicMedical, FaEnvelope, FaPhone } from "react-icons/fa";
import "./EditProfile.css";

const EditProfile = () => {
  // Stan początkowy - pobieramy z localStorage jeśli istnieje
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      clinicName: "Nazwa Gabinetu",
      email: "kontakt@gabinet.pl",
      phone: "+48 123 456 789",
      profilePicture: "https://via.placeholder.com/150"
    };
  });

  // Stan dla podglądu zdjęcia
  const [profilePicturePreview, setProfilePicturePreview] = useState(profile.profilePicture);
  
  // Stan dla powiadomienia
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  // Obsługa zmiany pól tekstowych
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  // Obsługa zmiany zdjęcia
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
        // Nie aktualizujemy od razu profilu - dopiero po zapisaniu
      };
      reader.readAsDataURL(file);
    }
  };

  // Zapisanie zmian
  const handleSave = () => {
    // Aktualizacja zdjęcia w profilu
    const updatedProfile = {
      ...profile,
      profilePicture: profilePicturePreview
    };
    
    // Zapisanie w localStorage
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    
    // Aktualizacja stanu lokalnego
    setProfile(updatedProfile);
    
    // Wyzwolenie zdarzenia aby powiadomić inne komponenty
    window.dispatchEvent(new Event('profileUpdated'));

    // Pokazanie powiadomienia
    setNotification({
      show: true,
      type: "success",
      message: "Pomyślnie zaktualizowano profil!"
    });

    // Ukrycie powiadomienia po 3 sekundach
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
              name="clinicName"
              value={profile.clinicName}
              onChange={handleInputChange}
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
              value={profile.email}
              onChange={handleInputChange}
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
              value={profile.phone}
              onChange={handleInputChange}
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