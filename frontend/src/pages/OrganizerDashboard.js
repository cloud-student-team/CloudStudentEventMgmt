import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

function OrganizerDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user'));

  const fetchData = useCallback(async () => {
    try {
      if (!token || !user) { navigate('/login'); return; }
      if (user.role !== 'organiser' && user.role !== 'organizer') {
        navigate('/'); return;
      }

      // Fetch all registrations for this organiser
      const [regRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/registrations/organizer/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/events`),
      ]);

      const allRegs = regRes.data;
      const myEvents = eventsRes.data.filter(
        (e) => e.organizer_id === user.id
      );

      // Calculate most popular event
      const regCountByEvent = {};
      allRegs.forEach((r) => {
        regCountByEvent[r.event_id] = (regCountByEvent[r.event_id] || 0) + 1;
      });

      const mostPopular = myEvents.reduce(
        (best, e) => {
          const count = regCountByEvent[e.id] || 0;
          return count > (regCountByEvent[best?.id] || 0) ? e : best;
        },
        myEvents[0] || null
      );

      // Recent registrations (last 5)
      const recentRegs = [...allRegs]
        .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))
        .slice(0, 5);

      // Stats per status
      const registered = allRegs.filter((r) => r.status === 'Registered').length;
      const attended = allRegs.filter((r) => r.status === 'Attended').length;
      const cancelled = allRegs.filter((r) => r.status === 'Cancelled').length;

      setStats({
        totalEvents: myEvents.length,
        totalRegistrations: allRegs.length,
        registered,
        attended,
        cancelled,
        mostPopular: mostPopular
          ? { ...mostPopular, regCount: regCountByEvent[mostPopular.id] || 0 }
          : null,
        recentRegs,
      });

      setEvents(myEvents);
    } catch (error) {
      toast.error('Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="card empty-state">Loading dashboard...</div>;

  const statCards = [
    { icon: '📅', label: 'My Events', value: stats.totalEvents, color: '#1d4ed8' },
    { icon: '📝', label: 'Total Registrations', value: stats.totalRegistrations, color: '#0D9488' },
    { icon: '✅', label: 'Registered', value: stats.registered, color: '#059669' },
    { icon: '🎓', label: 'Attended', value: stats.attended, color: '#7C3AED' },
    { icon: '❌', label: 'Cancelled', value: stats.cancelled, color: '#dc2626' },
  ];

  const today = new Date(); today.setHours(0,0,0,0);
  const upcomingEvents = events.filter(e => new Date(e.event_date?.split('T')[0]) >= today);
  const pastEvents = events.filter(e => new Date(e.event_date?.split('T')[0]) < today);

  return (
    <div className="page-container">
      <div className="premium-page-shell">

        {/* Header */}
        <div className="card info-banner">
          <h2>📊 Organiser Dashboard</h2>
          <p>Welcome back, <strong>{user.name}</strong>! Here's an overview of your events and registrations.</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <Link to="/create-event" className="btn btn-primary">+ Create Event</Link>
            <Link to="/organizer-registrations" className="btn btn-secondary">📋 All Registrations</Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {statCards.map((s) => (
            <div key={s.label} className="card stat-card" style={{ textAlign: 'center' }}>
              <div className="card-icon" style={{ margin: '0 auto 12px' }}>{s.icon}</div>
              <h3 style={{ fontSize: '2rem', margin: '0', color: s.color }}>{s.value}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Most Popular Event */}
        {stats.mostPopular && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, #0f172a, #1d4ed8 65%, #38bdf8 130%)',
            color: 'white', borderRadius: '24px', padding: '28px'
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: 800, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🏆 Most Popular Event
            </p>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>{stats.mostPopular.title}</h3>
            <p style={{ margin: '0 0 16px', opacity: 0.82 }}>
              📅 {stats.mostPopular.event_date?.split('T')[0]} &nbsp;•&nbsp;
              📍 {stats.mostPopular.venue || 'Venue TBA'} &nbsp;•&nbsp;
              👥 {stats.mostPopular.regCount} registrations
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to={`/events/${stats.mostPopular.id}`} className="btn btn-light" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                View Event
              </Link>
              <Link to={`/participants/${stats.mostPopular.id}`} className="btn btn-light-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                View Participants
              </Link>
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Recent Registrations */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px' }}>🕐 Recent Registrations</h3>
            {stats.recentRegs.length === 0 ? (
              <p style={{ color: '#64748b' }}>No registrations yet.</p>
            ) : stats.recentRegs.map((r) => (
              <div key={r.registration_id} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '10px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div>
                  <strong style={{ display: 'block' }}>{r.student_name}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{r.event_title}</span>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
                  background: r.status === 'Registered' ? '#dcfce7' : r.status === 'Attended' ? '#dbeafe' : '#fee2e2',
                  color: r.status === 'Registered' ? '#166534' : r.status === 'Attended' ? '#1d4ed8' : '#b91c1c',
                }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          {/* My Events Summary */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px' }}>📅 My Events</h3>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                UPCOMING ({upcomingEvents.length})
              </p>
              {upcomingEvents.slice(0, 3).map((e) => (
                <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <Link to={`/events/${e.id}`} style={{ fontWeight: 700, color: 'var(--primary)', display: 'block' }}>
                    {e.title}
                  </Link>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {e.event_date?.split('T')[0]} • {e.venue || 'Venue TBA'}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                PAST ({pastEvents.length})
              </p>
              {pastEvents.slice(0, 2).map((e) => (
                <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <Link to={`/events/${e.id}`} style={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                    {e.title}
                  </Link>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    {e.event_date?.split('T')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default OrganizerDashboard;
