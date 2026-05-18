import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL, { getPosterUrl } from '../config/api';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons (Webpack bundling issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const user = JSON.parse(sessionStorage.getItem('user'));
  const token = sessionStorage.getItem('token');

  const isOrganizer =
    user && (user.role === 'organiser' || user.role === 'organizer');

  useEffect(() => {
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      toast.error('Invalid event ID');
      setLoading(false);
      return;
    }

    const fetchEventDetails = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/events/${id}`
        );
        setEvent(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Could not load event details');
      } finally {
        setLoading(false);
      }
    };

    const fetchJoinedEvents = async () => {
      try {
        if (!token) return;
        const res = await axios.get(
          `${API_URL}/registrations/my/events`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const joinedIds = res.data.map((e) => e.id);
        setAlreadyJoined(joinedIds.includes(Number(id)));
      } catch {
        setAlreadyJoined(false);
      }
    };

    fetchEventDetails();
    fetchJoinedEvents();
  }, [id, token]);

  const joinEvent = async () => {
    if (!token) {
      toast.error('Please login to join events');
      navigate('/login');
      return;
    }
    setJoining(true);
    try {
      await axios.post(
        `${API_URL}/registrations/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('🎉 Joined event successfully!');
      setAlreadyJoined(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not join event');
    } finally {
      setJoining(false);
    }
  };

  const leaveEvent = async () => {
    if (!token) return;
    setLeaving(true);
    try {
        await axios.delete(
          `${API_URL}/registrations/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('You have left the event.');
      setAlreadyJoined(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not leave event');
    } finally {
      setLeaving(false);
    }
  };

  const deleteEvent = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this event?');
    if (!confirmed) return;
    try {
        await axios.delete(
          `${API_URL}/events/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('🗑️ Event deleted');
      navigate('/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete event');
    }
  };

  if (loading) {
    return (
      <div className="premium-page-shell">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
          <p style={{ margin: 0 }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="premium-page-shell">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>Event Not Found</h3>
          <p style={{ margin: '0 0 20px' }}>This event may have been removed or doesn't exist.</p>
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
        </div>
      </div>
    );
  }

  const eventDateFormatted = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-NZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Date TBA';

  const eventTimeFormatted = event.event_time
    ? event.event_time.slice(0, 5)
    : 'Time TBA';

  const isEventOwner =
    user && isOrganizer && user.id === event.organizer_id;

  const lat = event.latitude ? parseFloat(event.latitude) : null;
  const lng = event.longitude ? parseFloat(event.longitude) : null;
  const hasMap = lat && lng;

  return (
    <div className="premium-page-shell">

      {/* ── Poster Image ── */}
      {event.poster_url && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 24 }}>
          <img
            src={getPosterUrl(event.poster_url)}
            alt={`${event.title} poster`}
            style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div
        className="card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 65%, #38bdf8 130%)',
          color: 'white',
          padding: '40px 36px',
          borderRadius: '28px',
          boxShadow: '0 28px 80px rgba(15,23,42,0.18)',
          border: 'none',
        }}
      >
        {/* decorative blobs */}
        <div style={{
          position: 'absolute', width: 260, height: 260,
          borderRadius: '999px', background: 'rgba(255,255,255,0.07)',
          top: -100, right: -80, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 180, height: 180,
          borderRadius: '999px', background: 'rgba(56,189,248,0.12)',
          bottom: -60, right: 160, pointerEvents: 'none',
        }} />

        {/* back link */}
        <Link
          to="/events"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem',
            fontWeight: 700, marginBottom: 20,
          }}
        >
          ← Back to Events
        </Link>

        {/* badge row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <span style={{
            background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '999px', padding: '7px 14px', fontSize: '0.82rem', fontWeight: 800,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>📅 {eventDateFormatted}</span>
          <span style={{
            background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '999px', padding: '7px 14px', fontSize: '0.82rem', fontWeight: 800,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>🕐 {eventTimeFormatted}</span>
          <span style={{
            background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '999px', padding: '7px 14px', fontSize: '0.82rem', fontWeight: 800,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>📍 {event.venue || 'Venue TBA'}</span>
          {event.status && (
            <span style={{
              background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '999px', padding: '7px 14px', fontSize: '0.82rem', fontWeight: 800,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>🏷️ {event.status}</span>
          )}
        </div>

        {/* title */}
        <h1 style={{
          margin: '0 0 14px',
          fontSize: 'clamp(2rem, 4vw, 2.8rem)',
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          maxWidth: 760,
        }}>
          {event.title}
        </h1>

        <p style={{
          margin: '0 0 28px',
          color: 'rgba(255,255,255,0.82)',
          fontSize: '1.02rem',
          lineHeight: 1.75,
          maxWidth: 680,
        }}>
          {event.description || 'No description provided for this event.'}
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {/* Unauthenticated */}
          {!user && (
            <Link to="/login" className="btn btn-light" style={{ color: 'var(--primary)', fontWeight: 800 }}>
              🔐 Login to Join
            </Link>
          )}

          {/* Student buttons */}
          {user && !isOrganizer && (
            alreadyJoined ? (
              <button
                className="btn btn-danger"
                onClick={leaveEvent}
                disabled={leaving}
              >
                {leaving ? '⏳ Leaving...' : '🚪 Leave Event'}
              </button>
            ) : (
              <button
                className="btn btn-light"
                onClick={joinEvent}
                disabled={joining}
                style={{ color: 'var(--primary)', fontWeight: 800 }}
              >
                {joining ? '⏳ Joining...' : '🎟️ Join This Event'}
              </button>
            )
          )}

          {isEventOwner && (
            <>
              <Link
                to={`/participants/${event.id}`}
                className="btn btn-light"
                style={{ color: 'var(--primary)', fontWeight: 800 }}
              >
                👥 View Participants
              </Link>
              <button className="btn btn-danger" onClick={deleteEvent}>
                🗑️ Delete Event
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 20 }}>

        {/* Left — About */}
        <div className="card premium-glow-card" style={{ borderRadius: 24 }}>
          <div className="premium-kicker" style={{
            background: 'rgba(37,99,235,0.08)', color: 'var(--primary)',
            border: '1px solid rgba(37,99,235,0.14)', marginBottom: 16,
          }}>
            📋 About This Event
          </div>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8, fontSize: '1rem' }}>
            {event.description || 'No further details have been provided for this event. Check back later or contact the organiser for more information.'}
          </p>

          {/* Leaflet Map */}
          {hasMap && (
            <div style={{ marginTop: 24 }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📍 Event Location
              </p>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                <MapContainer
                  center={[lat, lng]}
                  zoom={15}
                  style={{ height: '280px', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lng]} />
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right — Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Organiser */}
          <div className="card" style={{ borderRadius: 22, padding: '20px 22px' }}>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Organised By
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
              }}>
                {(event.organizer_name || 'O')[0].toUpperCase()}
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text)' }}>
                  {event.organizer_name || 'Event Organiser'}
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Organiser</span>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="card" style={{ borderRadius: 22, padding: '20px 22px' }}>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Date & Time
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.25rem' }}>📅</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{eventDateFormatted}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.25rem' }}>🕐</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{eventTimeFormatted}</span>
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="card" style={{ borderRadius: 22, padding: '20px 22px' }}>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Venue
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: '1.25rem', marginTop: 2 }}>📍</span>
              <div>
                <strong style={{ display: 'block', color: 'var(--text)', marginBottom: 4 }}>
                  {event.venue || 'Venue TBA'}
                </strong>
                {event.venue && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    Open in Maps →
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Registration status chip */}
          {user && !isOrganizer && (
            <div className="card" style={{
              borderRadius: 22, padding: '18px 22px',
              background: alreadyJoined
                ? 'linear-gradient(135deg, #dcfce7, #f0fdf4)'
                : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              border: alreadyJoined
                ? '1px solid rgba(16,185,129,0.25)'
                : '1px solid rgba(37,99,235,0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>{alreadyJoined ? '✅' : '🎟️'}</span>
                <div>
                  <strong style={{ display: 'block', color: alreadyJoined ? '#166534' : 'var(--primary)' }}>
                    {alreadyJoined ? "You're registered!" : 'Not registered yet'}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {alreadyJoined ? 'See you there 🎉' : 'Click Join above to register'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Responsive override ── */}
      <style>{`
        @media (max-width: 768px) {
          .event-details-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default EventDetails;
