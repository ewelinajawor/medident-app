import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserRound, Users, Bell, KeyRound, ChevronRight } from "lucide-react";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  const sections = [
    {
      label: "Gabinet",
      options: [
        {
          id: 3,
          title: "Profil gabinetu",
          icon: UserRound,
          onClick: () => navigate("/edit-profile"),
          description: "Nazwa, logo i dane kontaktowe"
        },
        {
          id: 1,
          title: "Panel administracyjny",
          icon: ShieldCheck,
          onClick: () => navigate("/admin-panel"),
          description: "Automatyczna lista zakupów i dziennik aktywności"
        }
      ]
    },
    {
      label: "Konto i dostęp",
      options: [
        {
          id: 2,
          title: "Uprawnienia użytkowników",
          icon: Users,
          comingSoon: true,
          description: "Role i dostęp do poszczególnych modułów"
        },
        {
          id: 4,
          title: "Powiadomienia",
          icon: Bell,
          comingSoon: true,
          description: "Które powiadomienia dostajesz e-mailem i w aplikacji"
        },
        {
          id: 5,
          title: "Hasło",
          icon: KeyRound,
          comingSoon: true,
          description: "Zmiana hasła i ustawienia bezpieczeństwa"
        }
      ]
    }
  ];

  return (
    <div className="settings page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Ustawienia</h1>
          <p className="page-subtitle">Profil gabinetu, dostęp i preferencje aplikacji.</p>
        </div>
      </header>

      {sections.map((section) => (
        <section key={section.label} className="set-section">
          <h2 className="section-label">{section.label}</h2>
          <ul className="set-list card">
            {section.options.map(({ id, title, icon: Icon, onClick, description, comingSoon }) => (
              <li key={id}>
                <button
                  type="button"
                  className="set-row"
                  onClick={onClick}
                  disabled={comingSoon}
                >
                  <span className="set-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="set-text">
                    <span className="set-title">
                      {title}
                      {comingSoon && <span className="badge">Wkrótce</span>}
                    </span>
                    <span className="set-description">{description}</span>
                  </span>
                  {!comingSoon && <ChevronRight className="set-chevron" size={18} aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default Settings;
