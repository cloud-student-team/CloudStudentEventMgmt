import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [joinedEventIds, setJoinedEventIds] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    venue: '',
  });

  const user = JSON.parse(sessionStorage.getItem('user'));

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      setEvents(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Could not load events');
    }
  };

  const fetchJoinedEvents = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setJoinedEventIds([]);
        return;
      }
      const res = await axios.get(`${API_URL}/registrations/my/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJoinedEventIds(res.data.map((event) => event.id));
    } catch (error) {
      console.error(error);
      setJoinedEventIds([]);
    }
  };

  const joinEvent = async (eventId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }
      await axios.post(
        `${API_URL}/registrations/${eventId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('🎉 Joined event successfully');
      fetchJoinedEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not join event');
    }
  };

  const leaveEvent = async (eventId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      await axios.delete(
        `http://localhost:5001/api/registrations/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('You have left the event.');
      fetchJoinedEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not leave event');
    }
  };

  const startEdit = (event) => {
    setEditingEventId(event.id);
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      event_date: event.event_date?.split('T')[0] || '',
      event_time: event.event_time || '',
      venue: event.venue || '',
    });
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setEditForm({ title: '', description: '', event_date: '', event_time: '', venue: '' });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updateEvent = async (eventId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${API_URL}/events/${eventId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('✅ Event updated successfully');
      cancelEdit();
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update event');
    }
  };

  const deleteEvent = async (eventId) => {
    const confirmed = window.confirm('Are you sure you want to cancel/delete this event?');
    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_URL}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('🗑️ Event deleted successfully');
      fetchEvents();
      fetchJoinedEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete event');
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchJoinedEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const searchText = search.toLowerCase().trim();
      const eventDateOnly = event.event_date?.split('T')[0] || '';
      const eventDateObj = eventDateOnly ? new Date(eventDateOnly) : null;

      const matchesSearch =
        event.title?.toLowerCase().includes(searchText) ||
        event.venue?.toLowerCase().includes(searchText) ||
        event.description?.toLowerCase().includes(searchText);

      const matchesDate = selectedDate ? eventDateOnly === selectedDate : true;
      const matchesUpcoming = upcomingOnly ? eventDateObj && eventDateObj >= today : true;

      return matchesSearch && matchesDate && matchesUpcoming;
    });
  }, [events, search, selectedDate, upcomingOnly]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = [];
    const past = [];

    filteredEvents.forEach((event) => {
      const eventDateOnly = event.event_date?.split('T')[0] || '';
      const eventDateObj = eventDateOnly ? new Date(eventDateOnly) : null;
      if (eventDateObj && eventDateObj >= today) upcoming.push(event);
      else past.push(event);
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents]);

  const clearFilters = () => {
    setSearch('');
    setSelectedDate('');
    setUpcomingOnly(false);
  };

  const renderEventCard = (event) => {
    const alreadyJoined = joinedEventIds.includes(event.id);
    const isOrganizer =
      user &&
      (user.role === 'organiser' || user.role === 'organizer') &&
      user.id === event.organizer_id;

    return (
      <div key={event.id} className="card event-card">
        {editingEventId === event.id ? (
          <>
            <h3>Edit Event</h3>
            <input className="input" type="text" name="title" value={editForm.title} onChange={handleEditChange} />
            <textarea className="textarea" name="description" value={editForm.description} onChange={handleEditChange} />
            <input className="input" type="date" name="event_date" value={editForm.event_date} onChange={handleEditChange} />
            <input className="input" type="time" name="event_time" value={editForm.event_time} onChange={handleEditChange} />
            <input className="input" type="text" name="venue" value={editForm.venue} onChange={handleEditChange} />
            <div className="action-row">
              <button className="btn btn-primary" onClick={() => updateEvent(event.id)}>Save</button>
              <button className="btn btn-light-outline" onClick={cancelEdit}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            {event.poster_url && (
              <img
                src={`http://localhost:5001${event.poster_url}`}
                alt={`${event.title} poster`}
                style={{
                  width: '100%', height: '180px', objectFit: 'cover',
                  borderRadius: '12px', marginBottom: '12px', display: 'block',
                }}
              />
            )}
            <div className="event-badge-row">
              <span className="event-badge primary">{event.event_date?.split('T')[0] || 'Date TBA'}</span>
              <span className="event-badge muted">{event.event_time || 'Time TBA'}</span>
              <span className="event-badge accent">{event.venue || 'Venue TBA'}</span>
            </div>
            <h3>{event.title}</h3>
            <p>{event.description || 'No description available for this event yet.'}</p>
            <p className="event-meta"><strong>Organiser:</strong> {event.organizer_name || 'Event organiser'}</p>
            <div className="action-row">
              <Link to={`/events/${event.id}`} className="btn btn-primary link-btn">View Details</Link>
              {isOrganizer ? (
                <>
                  <button className="btn btn-secondary" onClick={() => startEdit(event)}>Edit Event</button>
                  <button className="btn btn-danger" onClick={() => deleteEvent(event.id)}>Delete Event</button>
                  <Link to={`/participants/${event.id}`} className="btn btn-light-outline link-btn">View Participants</Link>
                </>
              ) : !user ? (
                <Link to="/login" className="btn btn-secondary link-btn">Login to Join</Link>
              ) : alreadyJoined ? (
                <button
                  className="btn btn-danger"
                  onClick={() => leaveEvent(event.id)}
                >
                  Leave Event
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => joinEvent(event.id)}
                >
                  Join Event
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="card info-banner" style={{ marginBottom: '20px' }}>
        <h2>Events Directory</h2>
        <p>Browse upcoming activities, filter by date, and quickly access event details or participation options.</p>
      </div>

      <div className="card search-card">
        <div className="filters-grid">
          <input
            className="input"
            type="text"
            placeholder="Search by title, venue or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input className="input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <label className="checkbox-row">
            <input type="checkbox" checked={upcomingOnly} onChange={(e) => setUpcomingOnly(e.target.checked)} />
            <span>Upcoming only</span>
          </label>
          <button className="btn btn-light-outline" onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      <section style={{ marginBottom: '30px' }}>
        <h3 className="section-title">Upcoming Events</h3>
        {upcomingEvents.length === 0 ? <div className="card empty-state">No upcoming events found.</div> : <div className="event-grid">{upcomingEvents.map((event) => renderEventCard(event))}</div>}
      </section>

      <section>
        <h3 className="section-title">Past Events</h3>
        {pastEvents.length === 0 ? <div className="card empty-state">No past events found.</div> : <div className="event-grid">{pastEvents.map((event) => renderEventCard(event))}</div>}
      </section>
    </div>
  );
}

export default Events;
