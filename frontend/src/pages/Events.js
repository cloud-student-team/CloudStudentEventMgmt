import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import API_URL, { getPosterUrl } from '../config/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [joinedEventIds, setJoinedEventIds] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editPoster, setEditPoster] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    venue: '',
    status: 'Upcoming',
  });

  const user = JSON.parse(sessionStorage.getItem('user'));

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      setEvents(res.data);
    } catch {
      toast.error('Could not load events');
    }
  };

  const fetchJoinedEvents = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) { setJoinedEventIds([]); return; }
      const res = await axios.get(`${API_URL}/registrations/my/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJoinedEventIds(res.data.map((e) => e.id));
    } catch {
      setJoinedEventIds([]);
    }
  };

  const joinEvent = async (eventId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) { toast.error('Please login first'); return; }
      await axios.post(`${API_URL}/registrations/${eventId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      await axios.delete(`${API_URL}/registrations/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('You have left the event.');
      fetchJoinedEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not leave event');
    }
  };

  const startEdit = (event) => {
    setEditingEventId(event.id);
    setEditPoster(null);
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      event_date: event.event_date?.split('T')[0] || '',
      event_time: event.event_time || '',
      venue: event.venue || '',
      status: event.status || 'Upcoming',
    });
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setEditPoster(null);
    setEditForm({ title: '', description: '', event_date: '', event_time: '', venue: '', status: 'Upcoming' });
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const updateEvent = async (eventId) => {
    try {
      const token = sessionStorage.getItem('token');
      const data = new FormData();
      data.append('title', editForm.title);
      data.append('description', editForm.description);
      data.append('event_date', editForm.event_date);
      data.append('event_time', editForm.event_time);
      data.append('venue', editForm.venue);
      data.append('status', editForm.status);
      if (editPoster) data.append('poster', editPoster);
      await axios.put(`${API_URL}/events/${eventId}`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('✅ Event updated successfully');
      cancelEdit();
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update event');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
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

  useEffect(() => { fetchEvents(); fetchJoinedEvents(); }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Top 3 most popular upcoming events
  const popularEvents = useMemo(() => {
    return [...events]
      .filter(e => new Date(e.event_date?.split('T')[0]) >= today)
      .sort((a, b) => Number(b.registration_count) - Number(a.registration_count))
      .slice(0, 3);
  }, [events]);

  const filteredEvents = useMemo(() => {
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
    const upcoming = [], past = [];
    filteredEvents.forEach((event) => {
      const d = event.event_date ? new Date(event.event_date.split('T')[0]) : null;
      if (d && d >= today) upcoming.push(event);
      else past.push(event);
    });
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents]);

  const clearFilters = () => { setSearch(''); setSelectedDate(''); setUpcomingOnly(false); };

  const isFiltering = search || selectedDate || upcomingOnly;

  const statusStyle = (status) => {
    const map = {
      Upcoming:  { background: '#eff6ff', color: '#1d4ed8' },
      Ongoing:   { background: '#ecfdf5', color: '#059669' },
      Completed: { background: '#f1f5f9', color: '#475569' },
      Cancelled: { background: '#fee2e2', color: '#b91c1c' },
    };
    return map[status] || map.Upcoming;
  };

  // Mini recommendation card
  const renderMiniCard = (event) => {
    const alreadyJoined = joinedEventIds.includes(event.id);
    return (
      <div key={event.id} className="card" style={{
        display: 'flex', gap: '14px', alignItems: 'flex-start',
        padding: '16px', borderRadius: '16px',
      }}>
        {event.poster_url ? (
          <img src={getPosterUrl(event.poster_url)} alt={event.title}
            style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: '72px', height: '72px', borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
          }}>📅</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {Number(event.registration_count) > 0 && (
            <span style={{
              padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem',
              fontWeight: 800, background: '#fef9c3', color: '#92400e',
              display: 'inline-block', marginBottom: '4px',
            }}>
              🔥 {event.registration_count} joined
            </span>
          )}
          <strong style={{ display: 'block', marginBottom: '3px', fontSize: '0.92rem' }}>
            {event.title}
          </strong>
          <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '0.82rem' }}>
            📅 {event.event_date?.split('T')[0]} &nbsp;•&nbsp; 📍 {event.venue || 'TBA'}
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Link to={`/events/${event.id}`} className="btn btn-primary link-btn"
              style={{ padding: '5px 10px', fontSize: '0.82rem' }}>View</Link>
            {user && !alreadyJoined && (
              <button className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.82rem' }}
                onClick={() => joinEvent(event.id)}>Join</button>
            )}
            {user && alreadyJoined && (
              <span style={{
                padding: '5px 10px', borderRadius: '999px', fontSize: '0.82rem',
                fontWeight: 700, background: '#dcfce7', color: '#166534',
              }}>✅ Joined</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Full event card
  const renderEventCard = (event) => {
    const alreadyJoined = joinedEventIds.includes(event.id);
    const isOrganizer =
      user &&
      (user.role === 'organiser' || user.role === 'organizer') &&
      Number(user.id) === Number(event.organizer_id);

    return (
      <div key={event.id} className="card event-card">
        {editingEventId === event.id ? (
          <div>
            <h3 style={{ margin: '0 0 16px' }}>✏️ Edit Event</h3>
            <label className="form-label">Title</label>
            <input className="input" type="text" name="title" value={editForm.title} onChange={handleEditChange} required />
            <label className="form-label">Description</label>
            <textarea className="textarea" name="description" value={editForm.description} onChange={handleEditChange} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Date</label>
                <input className="input" type="date" name="event_date" value={editForm.event_date} onChange={handleEditChange} />
              </div>
              <div>
                <label className="form-label">Time</label>
                <input className="input" type="time" name="event_time" value={editForm.event_time} onChange={handleEditChange} />
              </div>
            </div>
            <label className="form-label">Venue</label>
            <input className="input" type="text" name="venue" value={editForm.venue} onChange={handleEditChange} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Status</label>
                <select className="select" name="status" value={editForm.status} onChange={handleEditChange}>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="form-label">Update Poster</label>
                <input className="input" type="file" accept="image/*"
                  onChange={(e) => setEditPoster(e.target.files[0] || null)} />
              </div>
            </div>
            {event.poster_url && !editPoster && (
              <div style={{ margin: '8px 0' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 6px' }}>Current poster:</p>
                <img src={getPosterUrl(event.poster_url)} alt="current"
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px' }} />
              </div>
            )}
            {editPoster && (
              <p style={{ fontSize: '0.85rem', color: '#059669', margin: '6px 0' }}>
                ✅ New poster: {editPoster.name}
              </p>
            )}
            <div className="action-row" style={{ marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => updateEvent(event.id)}>💾 Save Changes</button>
              <button className="btn btn-light-outline" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {event.poster_url && (
              <img src={getPosterUrl(event.poster_url)} alt={`${event.title} poster`}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px', display: 'block' }} />
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800, ...statusStyle(event.status) }}>
                {event.status || 'Upcoming'}
              </span>
              <span className="event-badge muted">{event.event_date?.split('T')[0] || 'Date TBA'}</span>
              <span className="event-badge muted">{event.event_time || 'Time TBA'}</span>
              {Number(event.registration_count) > 0 && (
                <span style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>
                  👥 {event.registration_count}
                </span>
              )}
            </div>
            <div className="event-badge-row">
              <span className="event-badge accent">{event.venue || 'Venue TBA'}</span>
            </div>
            <h3>{event.title}</h3>
            <p>{event.description || 'No description available.'}</p>
            <p className="event-meta"><strong>Organiser:</strong> {event.organizer_name || 'Event organiser'}</p>
            <div className="action-row">
              <Link to={`/events/${event.id}`} className="btn btn-primary link-btn">View Details</Link>
              {isOrganizer ? (
                <>
                  <button className="btn btn-secondary" onClick={() => startEdit(event)}>✏️ Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteEvent(event.id)}>🗑️ Delete</button>
                  <Link to={`/participants/${event.id}`} className="btn btn-light-outline link-btn">👥 Participants</Link>
                </>
              ) : !user ? (
                <Link to="/login" className="btn btn-secondary link-btn">Login to Join</Link>
              ) : alreadyJoined ? (
                <button className="btn btn-danger" onClick={() => leaveEvent(event.id)}>Leave Event</button>
              ) : (
                <button className="btn btn-secondary" onClick={() => joinEvent(event.id)}>Join Event</button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="card info-banner" style={{ marginBottom: '20px' }}>
        <h2>Events Directory</h2>
        <p>Browse upcoming activities, filter by date, and quickly access event details.</p>
      </div>

      {/* Search & Filters */}
      <div className="card search-card" style={{ marginBottom: '20px' }}>
        <div className="filters-grid">
          <input className="input" type="text"
            placeholder="Search by title, venue or description"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="input" type="date"
            value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <label className="checkbox-row">
            <input type="checkbox" checked={upcomingOnly}
              onChange={(e) => setUpcomingOnly(e.target.checked)} />
            <span>Upcoming only</span>
          </label>
          <button className="btn btn-light-outline" onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Popular Events — hidden when filtering */}
      {!isFiltering && popularEvents.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h3 className="section-title">
            🔥 Popular Events
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b', marginLeft: '8px' }}>
              Most joined
            </span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {popularEvents.map(renderMiniCard)}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section style={{ marginBottom: '30px' }}>
        <h3 className="section-title">
          {isFiltering ? `🔍 Results (${filteredEvents.length})` : `📅 Upcoming Events (${upcomingEvents.length})`}
        </h3>
        {upcomingEvents.length === 0
          ? <div className="card empty-state">No upcoming events found.</div>
          : <div className="event-grid">{upcomingEvents.map(renderEventCard)}</div>}
      </section>

      {/* Past Events */}
      <section>
        <h3 className="section-title">🕐 Past Events ({pastEvents.length})</h3>
        {pastEvents.length === 0
          ? <div className="card empty-state">No past events found.</div>
          : <div className="event-grid">{pastEvents.map(renderEventCard)}</div>}
      </section>
    </div>
  );
}

export default Events;
