import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';
import LocationPicker from '../components/LocationPicker';
import L from 'leaflet';

// Fix Leaflet default marker icons (Webpack bundling issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function CreateEvent() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    venue: '',
    latitude: '',
    longitude: '',
    status: 'Upcoming',
  });

  const [poster, setPoster] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');

    if (!storedUser) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);

    if (user.role !== 'organiser' && user.role !== 'organizer') {
      toast.error('Only organisers can create events');
      navigate('/');
      return;
    }

    setAllowed(true);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    setPoster(file || null);
  };

  const handleGetCoordinates = async () => {
    if (!formData.venue.trim()) {
      toast.error('Please enter venue first');
      return;
    }

    try {
      setLoadingLocation(true);

      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: formData.venue,
          format: 'json',
          limit: 1,
        },
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.data || res.data.length === 0) {
        toast.error('Location not found');
        return;
      }

      const location = res.data[0];

      setFormData((prev) => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lon,
      }));

      toast.success('Coordinates loaded successfully');
    } catch (error) {
      console.error('Location fetch error:', error);
      toast.error('Failed to fetch coordinates');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const token = sessionStorage.getItem('token');

      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('event_date', formData.event_date);
      data.append('event_time', formData.event_time);
      data.append('venue', formData.venue);
      data.append('latitude', formData.latitude);
      data.append('longitude', formData.longitude);
      data.append('status', formData.status);

      if (poster) {
        data.append('poster', poster);
      }

      await axios.post(`${API_URL}/events`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Event created successfully');

      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        venue: '',
        latitude: '',
        longitude: '',
        status: 'Upcoming',
      });
      setPoster(null);

      navigate('/');
    } catch (error) {
      console.error('Create event error:', error);
      toast.error(error.response?.data?.message || 'Event creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDateTime = useMemo(() => {
    if (!formData.event_date || !formData.event_time) return 'Choose a date and time';
    const parsed = new Date(`${formData.event_date}T${formData.event_time}`);
    if (Number.isNaN(parsed.getTime())) return 'Choose a date and time';
    return parsed.toLocaleString();
  }, [formData.event_date, formData.event_time]);

  const locationReady = Boolean(formData.latitude && formData.longitude);

  if (!allowed) return null;

  return (
    <div className="premium-page-shell">
      <section className="premium-hero premium-hero-event">
        <div className="premium-hero-copy">
          <span className="premium-kicker">Organizer workspace</span>
          <h1>Create a polished event experience</h1>
          <p>
            Launch premium-looking student events with scheduling, venue intelligence,
            optional poster upload, and a cleaner publishing workflow.
          </p>

          <div className="premium-hero-actions">
            <Link to="/" className="btn btn-light-outline link-btn">
              Browse Events
            </Link>
            <Link to="/organizer-registrations" className="btn btn-secondary link-btn">
              Registration Hub
            </Link>
          </div>
        </div>

        <div className="premium-hero-panel">
          <div className="mini-stat-grid">
            <div className="mini-stat-card">
              <span>Publish status</span>
              <strong>{formData.status}</strong>
            </div>
            <div className="mini-stat-card">
              <span>Schedule</span>
              <strong>{selectedDateTime}</strong>
            </div>
            <div className="mini-stat-card">
              <span>Venue mapped</span>
              <strong>{locationReady ? 'Ready' : 'Pending'}</strong>
            </div>
            <div className="mini-stat-card">
              <span>Poster</span>
              <strong>{poster ? poster.name : 'Not added'}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="premium-two-column-layout premium-create-layout">
        <section className="card premium-form-card premium-glow-card">
          <div className="section-header-row">
            <div>
              <span className="section-chip">Event composer</span>
              <h2 className="page-title">Create Event</h2>
              <p className="page-subtitle">
                Fill in the key details below to publish an event with a refined, professional layout.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="premium-form-grid">
            <div className="premium-field full-span">
              <label className="form-label">Event Title</label>
              <input
                className="input premium-input"
                type="text"
                name="title"
                placeholder="Leadership Summit 2026"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="premium-field full-span">
              <label className="form-label">Description</label>
              <textarea
                className="textarea premium-input"
                name="description"
                placeholder="Describe the event experience, agenda, and why students should join."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="premium-field">
              <label className="form-label">Date</label>
              <input
                className="input premium-input"
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="premium-field">
              <label className="form-label">Time</label>
              <input
                className="input premium-input"
                type="time"
                name="event_time"
                value={formData.event_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="premium-field full-span">
              <label className="form-label">Venue / Address</label>
              <input
                className="input premium-input"
                type="text"
                name="venue"
                placeholder="Sir Owen G Glenn Building, Auckland"
                value={formData.venue}
                onChange={handleChange}
                required
              />
            </div>

            <div className="premium-field full-span inline-action-field">
              <button
                className="btn btn-light-outline"
                type="button"
                onClick={handleGetCoordinates}
                disabled={loadingLocation}
              >
                {loadingLocation ? 'Mapping venue...' : 'Get Coordinates'}
              </button>

              <div className="coordinate-status-pill">
                {locationReady
                  ? `Lat ${formData.latitude} • Lng ${formData.longitude}`
                  : 'Coordinates not loaded yet'}
              </div>
            </div>

            <div className="premium-field">
              <label className="form-label">Latitude</label>
              <input
                className="input premium-input"
                type="text"
                name="latitude"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={handleChange}
              />
            </div>

            <div className="premium-field">
              <label className="form-label">Longitude</label>
              <input
                className="input premium-input"
                type="text"
                name="longitude"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={handleChange}
              />
            </div>

            <div className="premium-field full-span">
              <label className="form-label">Pin Location on Map</label>
              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                Click on the map to set precise coordinates, or use "Get Coordinates" above.
              </p>
              <LocationPicker formData={formData} setFormData={setFormData} />
            </div>

            <div className="premium-field">
              <label className="form-label">Status</label>
              <select
                className="select premium-input"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="premium-field">
              <label className="form-label">Poster</label>
              <input
                className="input premium-input"
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
              />
            </div>

            <div className="premium-form-actions full-span">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Publishing event...' : 'Create Event'}
              </button>
              <Link to="/" className="btn btn-light-outline link-btn">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <aside className="premium-side-stack">
          <div className="card premium-side-card">
            <span className="section-chip">Live preview</span>
            <h3 className="section-title">Event snapshot</h3>

            <div className="premium-preview-card">
              <div className="preview-topline">
                <span className="event-badge primary">{formData.status}</span>
                <span className="event-badge accent">Organizer draft</span>
              </div>
              <h3>{formData.title || 'Your event title will appear here'}</h3>
              <p>
                {formData.description || 'Add a strong description so students immediately understand the value of attending.'}
              </p>
              <div className="preview-meta-list">
                <div><strong>When:</strong> {selectedDateTime}</div>
                <div><strong>Where:</strong> {formData.venue || 'Venue not added'}</div>
                <div><strong>Poster:</strong> {poster ? poster.name : 'No file selected'}</div>
              </div>
            </div>
          </div>

          <div className="card premium-side-card">
            <span className="section-chip">Quick navigation</span>
            <h3 className="section-title">Move around the platform</h3>
            <div className="premium-nav-list">
              <Link to="/" className="premium-nav-item">Home</Link>
              <Link to="/" className="premium-nav-item">Events Directory</Link>
              <Link to="/organizer-registrations" className="premium-nav-item">All Registrations</Link>
              <Link to="/profile" className="premium-nav-item">Profile</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CreateEvent;
