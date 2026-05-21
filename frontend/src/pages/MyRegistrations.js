import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL, { getPosterUrl } from '../config/api';

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [view, setView] = useState('cards'); // 'cards' or 'table'
  const token = sessionStorage.getItem('token');

  const fetchMyRegistrations = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/registrations/my/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load registrations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const cancelRegistration = async (eventId) => {
    if (!window.confirm('Cancel your registration for this event?')) return;
    try {
      await axios.delete(`${API_URL}/registrations/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Registration cancelled successfully');
      fetchMyRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not cancel registration');
    }
  };

  useEffect(() => { fetchMyRegistrations(); }, [fetchMyRegistrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) =>
      statusFilter === 'All' ? true : item.status === statusFilter
    );
  }, [registrations, statusFilter]);

  const stats = useMemo(() => ({
    total: registrations.length,
    registered: registrations.filter((r) => r.status === 'Registered').length,
    attended: registrations.filter((r) => r.status === 'Attended').length,
    cancelled: registrations.filter((r) => r.status === 'Cancelled').length,
  }), [registrations]);

  const statusStyle = (status) => {
    const map = {
      Registered: { background: '#dcfce7', color: '#166534', icon: '✅' },
      Attended:   { background: '#dbeafe', color: '#1d4ed8', icon: '🎓' },
      Cancelled:  { background: '#fee2e2', color: '#b91c1c', icon: '❌' },
    };
    return map[status] || { background: '#f1f5f9', color: '#475569', icon: '📝' };
  };

  const today = new Date(); today.setHours(0,0,0,0);

  const upcoming = filteredRegistrations.filter(
    (r) => new Date(r.event_date?.split('T')[0]) >= today
  );
  const past = filteredRegistrations.filter(
    (r) => new Date(r.event_date?.split('T')[0]) < today
  );

  if (loading) return <div className="card empty-state">Loading your registrations...</div>;

  return (
    <div className="premium-page-shell">

      {/* Header */}
      <div className="card info-banner">
        <h2>🎫 My Registrations</h2>
        <p>View and manage all your event registrations in one place.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total', value: stats.total, color: '#1d4ed8', icon: '📝' },
          { label: 'Registered', value: stats.registered, color: '#059669', icon: '✅' },
          { label: 'Attended', value: stats.attended, color: '#7C3AED', icon: '🎓' },
          { label: 'Cancelled', value: stats.cancelled, color: '#dc2626', icon: '❌' },
        ].map((s) => (
          <div key={s.label} className="card stat-card" style={{ textAlign: 'center', padding: '18px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
            <h3 style={{ fontSize: '1.8rem', margin: '0', color: s.color }}>{s.value}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <div className="card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="select"
          style={{ flex: '1', minWidth: '150px', marginBottom: '0' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Registered">Registered</option>
          <option value="Attended">Attended</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
          {filteredRegistrations.length} of {registrations.length} registrations
        </span>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            className={`btn ${view === 'cards' ? 'btn-primary' : 'btn-light-outline'}`}
            onClick={() => setView('cards')}
          >
            🃏 Cards
          </button>
          <button
            className={`btn ${view === 'table' ? 'btn-primary' : 'btn-light-outline'}`}
            onClick={() => setView('table')}
          >
            📋 Table
          </button>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="card empty-state">
          <p>You have not registered for any events yet.</p>
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
        </div>
      ) : view === 'cards' ? (
        /* ── CARD VIEW ── */
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="section-title">📅 Upcoming ({upcoming.length})</h3>
              <div className="event-grid">
                {upcoming.map((item) => {
                  const { background, color, icon } = statusStyle(item.status);
                  return (
                    <div key={item.id} className="card event-card" style={{ position: 'relative' }}>
                      {/* Status badge top right */}
                      <div style={{
                        position: 'absolute', top: '14px', right: '14px',
                        padding: '5px 12px', borderRadius: '999px',
                        fontSize: '0.8rem', fontWeight: 800,
                        background, color, zIndex: 1,
                      }}>
                        {icon} {item.status || 'Registered'}
                      </div>

                      {item.poster_url && (
                        <img
                          src={getPosterUrl(item.poster_url)}
                          alt={item.title}
                          style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                        />
                      )}

                      <div className="event-badge-row">
                        <span className="event-badge primary">{item.event_date?.split('T')[0] || 'Date TBA'}</span>
                        <span className="event-badge muted">{item.event_time || 'Time TBA'}</span>
                      </div>

                      <h3>{item.title}</h3>
                      <p className="event-meta">📍 {item.venue || 'Venue TBA'}</p>

                      <div className="action-row">
                        <Link to={`/events/${item.id}`} className="btn btn-primary link-btn">View Event</Link>
                        {item.status === 'Registered' && (
                          <button className="btn btn-danger" onClick={() => cancelRegistration(item.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="section-title">🕐 Past Events ({past.length})</h3>
              <div className="event-grid">
                {past.map((item) => {
                  const { background, color, icon } = statusStyle(item.status);
                  return (
                    <div key={item.id} className="card event-card" style={{ position: 'relative', opacity: 0.85 }}>
                      <div style={{
                        position: 'absolute', top: '14px', right: '14px',
                        padding: '5px 12px', borderRadius: '999px',
                        fontSize: '0.8rem', fontWeight: 800,
                        background, color, zIndex: 1,
                      }}>
                        {icon} {item.status || 'Registered'}
                      </div>

                      <div className="event-badge-row">
                        <span className="event-badge muted">{item.event_date?.split('T')[0] || 'Date TBA'}</span>
                        <span className="event-badge muted">{item.event_time || 'Time TBA'}</span>
                      </div>

                      <h3>{item.title}</h3>
                      <p className="event-meta">📍 {item.venue || 'Venue TBA'}</p>

                      <div className="action-row">
                        <Link to={`/events/${item.id}`} className="btn btn-light-outline link-btn">View Details</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="participants-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((item) => {
                  const { background, color, icon } = statusStyle(item.status);
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong></td>
                      <td>{item.event_date?.split('T')[0] || 'TBA'}</td>
                      <td>{item.event_time || 'TBA'}</td>
                      <td>{item.venue || 'TBA'}</td>
                      <td>
                        <span style={{
                          padding: '5px 12px', borderRadius: '999px',
                          fontSize: '0.82rem', fontWeight: 800,
                          background, color,
                        }}>
                          {icon} {item.status || 'Registered'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/events/${item.id}`} className="btn btn-primary link-btn">View</Link>
                          {item.status === 'Registered' && (
                            <button className="btn btn-danger" onClick={() => cancelRegistration(item.id)}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRegistrations;
