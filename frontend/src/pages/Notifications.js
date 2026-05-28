import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const token = sessionStorage.getItem('token');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch {
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch {
      toast.error('Could not mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Could not mark all as read');
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'reminder') return n.type === 'reminder';
    if (filter === 'announcement') return n.type === 'announcement';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeStyle = (type) => {
    if (type === 'reminder') return { bg: '#fef9c3', color: '#92400e', icon: '⏰' };
    if (type === 'announcement') return { bg: '#eff6ff', color: '#1d4ed8', icon: '📢' };
    return { bg: '#f1f5f9', color: '#475569', icon: '🔔' };
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) return <div className="card empty-state">Loading notifications...</div>;

  return (
    <div className="page-container">
      <div className="premium-page-shell">

        <div className="card info-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2>🔔 Notifications</h2>
              <p style={{ margin: 0 }}>
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button className="btn btn-light-outline" onClick={markAllRead}>
                ✅ Mark All Read
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'reminder', label: '⏰ Reminders' },
            { key: 'announcement', label: '📢 Announcements' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              padding: '8px 16px', border: 'none', borderRadius: '999px',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              background: filter === tab.key ? '#1d4ed8' : '#f1f5f9',
              color: filter === tab.key ? 'white' : '#475569',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card empty-state">
            <p>No notifications found.</p>
            <Link to="/" className="btn btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(n => {
              const { bg, color, icon } = typeStyle(n.type);
              return (
                <div key={n.id} className="card" style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${color}`,
                  background: n.is_read ? 'white' : '#f8fbff',
                  cursor: !n.is_read ? 'pointer' : 'default',
                  borderRadius: '16px',
                }} onClick={() => !n.is_read && markAsRead(n.id)}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <strong style={{ color: n.is_read ? '#475569' : '#0f172a' }}>{n.title}</strong>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {!n.is_read && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }} />
                          )}
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                      <p style={{ margin: '6px 0 8px', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {n.message}
                      </p>
                      {n.event_title && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '999px', background: bg, color, fontSize: '0.8rem', fontWeight: 700 }}>
                            📅 {n.event_title}
                          </span>
                          {n.event_date && (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                              {new Date(n.event_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

