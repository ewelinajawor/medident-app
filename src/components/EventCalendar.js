// EventCalendar.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pl';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventCalendar.css';

// Ustaw lokalizację dla kalendarza
moment.locale('pl');
const localizer = momentLocalizer(moment);

const EventCalendar = ({ onEventAdded }) => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    type: 'inventory', // inventory, delivery, meeting, etc.
    description: ''
  });

  // Pobierz wydarzenia z localStorage
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    // Konwertuj stringi dat na obiekty Date
    const parsedEvents = storedEvents.map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    }));
    setEvents(parsedEvents);
  }, []);

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

  // Style dla wydarzeń różnych typów
  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3498db'
    };
    
    switch(event.type) {
      case 'inventory':
        style.backgroundColor = '#f1c40f'; // żółty
        break;
      case 'delivery':
        style.backgroundColor = '#2ecc71'; // zielony
        break;
      case 'meeting':
        style.backgroundColor = '#9b59b6'; // fioletowy
        break;
      default:
        break;
    }
    
    return { style };
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3>Kalendarz wydarzeń</h3>
        <button 
          className="add-event-button"
          onClick={() => setShowAddModal(true)}
        >
          Dodaj wydarzenie
        </button>
      </div>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventStyleGetter}
        messages={{
          next: "Następny",
          previous: "Poprzedni",
          today: "Dziś",
          month: "Miesiąc",
          week: "Tydzień",
          day: "Dzień"
        }}
      />
      
      {showAddModal && (
        <div className="modal-overlay">
          <div className="event-modal">
            <h3>Dodaj nowe wydarzenie</h3>
            
            <div className="form-group">
              <label>Tytuł</label>
              <input 
                type="text" 
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Typ wydarzenia</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
              >
                <option value="inventory">Inwentaryzacja</option>
                <option value="delivery">Dostawa</option>
                <option value="meeting">Spotkanie</option>
                <option value="other">Inne</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Data rozpoczęcia</label>
              <input 
                type="datetime-local" 
                value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setNewEvent({
                  ...newEvent, 
                  start: new Date(e.target.value)
                })}
              />
            </div>
            
            <div className="form-group">
              <label>Data zakończenia</label>
              <input 
                type="datetime-local" 
                value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setNewEvent({
                  ...newEvent, 
                  end: new Date(e.target.value)
                })}
              />
            </div>
            
            <div className="form-group">
              <label>Opis</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows="3"
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowAddModal(false)}>
                Anuluj
              </button>
              <button className="add-button" onClick={handleAddEvent}>
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