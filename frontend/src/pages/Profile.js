import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Profile() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user'));

  const fetchProfile = useCallback(async () => {
    try {
      if (!token) { toast.error('Please login first'); navigate('/login'); return; }
      const res = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData((prev) => ({
        ...prev,
        name: res.data.name || '',
        email: res.data.email || '',
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  const fetchRegistrations = useCallback(async () => {
    try {
      if (!token) return;
      const res = await axios.get(`${API_URL}/registrations/my/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(res.data || []);
    } catch {
      setRegistrations([]);
    } finally {
      setLoadingRegs(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchRegistrations();
  }, [fetchProfile, fetchRegistrations]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('✅ Profile updated successfully');
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update profile');
    }
  };

  const statusStyle = (status) => {
    const map = {
      Registered: { background: '#dcfce7', color: '#166534', icon: '✅' },
      Attended:   { background: '#dbeafe', color: '#1d4ed8', icon: '🎓' },
      Cancelled:  { background: '#fee2e2', color: '#b91c1c', icon: '❌' },
    };
    return map[status] || { background: '#f1f5f9', color: '#475569', icon: '📝' };
  };

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = registrations.filter(r => new Date(r.event_date?.split('T')[0]) >= today);
  const past = registrations.filter(r => new Date(r.event_date?.split('T')[0]) < today);

  if (loading) return <div className="card empty-state">Loading profile...</div>;

  return (
    <div className="page-container">
      <div className="premium-page-shell">

        {/* Profile Header Card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #0f172a, #1d4ed8 65%, #38bdf8 130%)',
          color: 'white', borderRadius: '24px', padding: '28px',
          display: 'flex', alignItems: 'center', gap: '20px'
        }}>
          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, flexShrink: 0,
          }}>
            {formData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>{formData.name}</h2>
            <p style={{ margin: '0 0 8px', opacity: 0.82 }}>{formData.email}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px', borderRadius: '999px', fontSize: '0.82rem',
                fontWeight: 800, background: 'rgba(255,255,255,0.15)',
                textTransform: 'capitalize'
              }}>
                {user?.role || 'student'}
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: '999px', fontSize: '0.82rem',
                fontWeight: 800, background: 'rgba(255,255,255,0.15)',
              }}>
                📝 {registrations.length} registrations
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: '999px', fontSize: '0.82rem',
                fontWeight: 800, background: 'rgba(255,255,255,0.15)',
              }}>
                📅 {upcoming.length} upcoming
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
          {[
            { key: 'profile', label: '👤 Edit Profile' },
            { key: 'history', label: '📋 Registration History' },
            { key: 'timeline', label: '🕐 Timeline' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                borderBottom: activeTab === tab.key ? '3px solid #1d4ed8' : '3px solid transparent',
                color: activeTab === tab.key ? '#1d4ed8' : '#64748b',
                marginBottom: '-2px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="card form-card" style={{ maxWidth: '100%' }}>
            <h3 className="page-title">Edit Profile</h3>
            <p className="page-subtitle">Update your personal details and password settings securely.</p>

            <div className="profile-summary">
              <div className="profile-chip">
                <span>Name</span>
                <strong>{formData.name || 'Not available'}</strong>
              </div>
              <div className="profile-chip">
                <span>Email</span>
                <strong>{formData.email || 'Not available'}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="form-label">Full Name</label>
              <input className="input" type="text" name="name"
                placeholder="Full Name" value={formData.name}
                onChange={handleChange} required />

              <label className="form-label">Email Address</label>
              <input className="input" type="email" name="email"
                placeholder="Email Address" value={formData.email}
                onChange={handleChange} required />

              <label className="form-label">Current Password</label>
              <input className="input" type="password" name="currentPassword"
                placeholder="Enter current password to change it"
                value={formData.currentPassword} onChange={handleChange} />

              <label className="form-label">New Password</label>
              <input className="input" type="password" name="newPassword"
                placeholder="Enter new password (optional)"
                value={formData.newPassword} onChange={handleChange} />

              <button className="btn btn-primary" type="submit">
                💾 Update Profile
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px' }}>📋 Registration History</h3>
            {loadingRegs ? (
              <p>Loading...</p>
            ) : registrations.length === 0 ? (
              <div className="empty-state">
                <p>No registrations yet.</p>
                <Link to="/events" className="btn btn-primary">Browse Events</Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="participants-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Venue</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((item) => {
                      const { background, color, icon } = statusStyle(item.status);
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.title}</strong></td>
                          <td style={{ color: '#64748b' }}>{item.event_date?.split('T')[0] || 'TBA'}</td>
                          <td style={{ color: '#64748b' }}>{item.venue || 'TBA'}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px', borderRadius: '999px',
                              fontSize: '0.82rem', fontWeight: 800,
                              background, color,
                            }}>
                              {icon} {item.status}
                            </span>
                          </td>
                          <td>
                            <Link to={`/events/${item.id}`} className="btn btn-primary link-btn">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="card">
            <h3 style={{ margin: '0 0 20px' }}>🕐 Events Timeline</h3>
            {loadingRegs ? <p>Loading...</p> : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <p style={{ fontWeight: 800, color: '#1d4ed8', margin: '0 0 12px' }}>
                      📅 Upcoming ({upcoming.length})
                    </p>
                    {upcoming.map((item, i) => {
                      const { background, color, icon } = statusStyle(item.status);
                      return (
                        <div key={item.id} style={{
                          display: 'flex', gap: '16px', marginBottom: '16px',
                          paddingBottom: '16px',
                          borderBottom: i < upcoming.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}>
                          {/* Timeline dot */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '14px', height: '14px', borderRadius: '50%',
                              background: '#1d4ed8', flexShrink: 0, marginTop: '4px'
                            }} />
                            {i < upcoming.length - 1 && (
                              <div style={{ width: '2px', flex: 1, background: '#e2e8f0', marginTop: '4px' }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <strong>{item.title}</strong>
                              <span style={{
                                padding: '3px 10px', borderRadius: '999px',
                                fontSize: '0.8rem', fontWeight: 800,
                                background, color,
                              }}>
                                {icon} {item.status}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                              📅 {item.event_date?.split('T')[0]} &nbsp;•&nbsp;
                              🕐 {item.event_time || 'TBA'} &nbsp;•&nbsp;
                              📍 {item.venue || 'TBA'}
                            </p>
                            <Link to={`/events/${item.id}`} style={{
                              color: '#1d4ed8', fontWeight: 700,
                              fontSize: '0.85rem', marginTop: '6px', display: 'inline-block'
                            }}>
                              View Event →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {past.length > 0 && (
                  <>
                    <p style={{ fontWeight: 800, color: '#64748b', margin: '16px 0 12px' }}>
                      🕐 Past Events ({past.length})
                    </p>
                    {past.map((item, i) => {
                      const { background, color, icon } = statusStyle(item.status);
                      return (
                        <div key={item.id} style={{
                          display: 'flex', gap: '16px', marginBottom: '16px',
                          paddingBottom: '16px', opacity: 0.75,
                          borderBottom: i < past.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '14px', height: '14px', borderRadius: '50%',
                              background: '#94a3b8', flexShrink: 0, marginTop: '4px'
                            }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <strong>{item.title}</strong>
                              <span style={{
                                padding: '3px 10px', borderRadius: '999px',
                                fontSize: '0.8rem', fontWeight: 800,
                                background, color,
                              }}>
                                {icon} {item.status}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                              📅 {item.event_date?.split('T')[0]} &nbsp;•&nbsp;
                              📍 {item.venue || 'TBA'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {registrations.length === 0 && (
                  <div className="empty-state">
                    <p>No events in your timeline yet.</p>
                    <Link to="/events" className="btn btn-primary">Browse Events</Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Profile;
