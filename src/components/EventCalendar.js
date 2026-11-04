// EventCalendar.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pl';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X } from 'lucide-react';
import './EventCalendar.css';

// Ustaw lokalizację dla kalendarza
moment.locale('pl');
const localizer = momentLocalizer(moment);

const EventCalendar = ({ onEventAdded }) => {
  // Wczytanie przy inicjalizacji stanu – wcześniej efekt zapisu nadpisywał zapisane wydarzenia pustą listą,
  // zanim zdążyły się wczytać (w trybie StrictMode wydarzenia znikały).
  const [events, setEvents] = useState(() =>
    (JSON.parse(localStorage.getItem('calendarEvents')) || []).map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    }))
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    type: 'inventory', // inventory, delivery, meeting, etc.
    description: ''
  });

  // Zapisz wydarzenia w localStorage
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    
    // Powiadom dashboard o zmianie wydarzeń (do aktualizacji powiadomień)
    if (onEventAdded) {
      onEventAdded(events);
    }
  }, [events, onEventAdded]);

  // Dodaj nowe wydarzenie
  const handleAddEvent = () => {
    const eventToAdd = {
      ...newEvent,
      id: Date.now()
    };
    setEvents([...events, eventToAdd]);
    setShowAddModal(false);
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(),
      type: 'inventory',
      description: ''
    });
  };

  // Kolor wydarzenia zależy od typu – te same kolory co na liście „Dzisiaj” na stronie głównej.
  const eventStyleGetter = (event) => ({
    className: `ec-event ec-event-${event.type || 'other'}`
  });

  const EVENT_TYPES = [
    { value: 'inventory', label: 'Inwentaryzacja' },
    { value: 'delivery', label: 'Dostawa' },
    { value: 'meeting', label: 'Spotkanie' },
    { value: 'other', label: 'Inne' }
  ];

  return (
    <div className="event-calendar">
      <div className="ec-header">
        <div>
          <h3 className="ec-title">Kalendarz</h3>
          <ul className="ec-legend" aria-label="Legenda">
            {EVENT_TYPES.map((t) => (
              <li key={t.value}>
                <span className={`ec-swatch ec-swatch-${t.value}`} aria-hidden="true" />
                {t.label}
              </li>
            ))}
          </ul>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus /> Dodaj wydarzenie
        </button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 560 }}
        eventPropGetter={eventStyleGetter}
        messages={{
          next: "Następny",
          previous: "Poprzedni",
          today: "Dziś",
          month: "Miesiąc",
          week: "Tydzień",
          day: "Dzień",
          agenda: "Lista",
          date: "Data",
          time: "Godzina",
          event: "Wydarzenie",
          noEventsInRange: "Brak wydarzeń w tym okresie.",
          showMore: (total) => `+${total} więcej`
        }}
      />

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="ec-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ec-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ec-modal-head">
              <h3 id="ec-modal-title">Nowe wydarzenie</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)} aria-label="Zamknij">
                <X />
              </button>
            </div>

            <div className="ec-modal-body">
              <div className="ec-field">
                <label htmlFor="ec-title">Tytuł</label>
                <input
                  id="ec-title"
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="np. Dostawa z Koldentalu"
                />
              </div>

              <div className="ec-field">
                <label htmlFor="ec-type">Typ</label>
                <select
                  id="ec-type"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="ec-row">
                <div className="ec-field">
                  <label htmlFor="ec-start">Początek</label>
                  <input
                    id="ec-start"
                    type="datetime-local"
                    value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      start: new Date(e.target.value)
                    })}
                  />
                </div>

                <div className="ec-field">
                  <label htmlFor="ec-end">Koniec</label>
                  <input
                    id="ec-end"
                    type="datetime-local"
                    value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      end: new Date(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="ec-field">
                <label htmlFor="ec-description">Opis <span className="muted">(opcjonalnie)</span></label>
                <textarea
                  id="ec-description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows="3"
                />
              </div>
            </div>

            <div className="ec-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Anuluj
              </button>
              <button className="btn btn-primary" onClick={handleAddEvent}>
                Dodaj wydarzenie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
