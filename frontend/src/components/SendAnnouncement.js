import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

function SendAnnouncement({ eventId, eventTitle, participantCount }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const token = sessionStorage.getItem('token');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/notifications/announce`,
        { event_id: eventId, title, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`📢 ${res.data.message}`);
      setTitle('');
      setMessage('');
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send announcement');
    } finally {
      setSending(false);
    }
  };

  const quickMessages = [
    `Reminder: "${eventTitle}" is tomorrow — don't forget!`,
    `Venue update for "${eventTitle}" — please check the event page.`,
    `"${eventTitle}" starts soon — we look forward to seeing you!`,
    `Important update regarding "${eventTitle}" — please read carefully.`,
  ];

  return (
    <div className="card" style={{ marginTop: '20px', borderRadius: '20px' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <div>
          <h3 style={{ margin: '0 0 4px' }}>📢 Send Announcement</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Notify all {participantCount} registered participants
          </p>
        </div>
        <span style={{ fontSize: '1.3rem', color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <form onSubmit={handleSend} style={{ marginTop: '16px' }}>

          {/* Quick message templates */}
          <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
            Quick Templates:
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {quickMessages.map((msg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTitle(i === 0 ? 'Event Reminder' : i === 1 ? 'Venue Update' : i === 2 ? 'Starting Soon' : 'Important Update');
                  setMessage(msg);
                }}
                style={{
                  padding: '5px 10px', borderRadius: '999px', border: '1px solid #e2e8f0',
                  background: '#f8fbff', color: '#1d4ed8', fontSize: '0.78rem',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                {i === 0 ? '⏰ Reminder' : i === 1 ? '📍 Venue Update' : i === 2 ? '🎉 Starting Soon' : '⚠️ Important'}
              </button>
            ))}
          </div>

          <label className="form-label">Announcement Title</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Venue Update, Event Reminder..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="form-label">Message</label>
          <textarea
            className="textarea"
            placeholder="Write your message to all participants..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ minHeight: '100px' }}
            required
          />

          {/* Preview */}
          {(title || message) && (
            <div style={{
              padding: '12px 16px', borderRadius: '12px',
              background: '#f8fbff', border: '1px solid #dbeafe',
              marginBottom: '14px',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 800, color: '#1d4ed8' }}>
                PREVIEW
              </p>
              <strong style={{ display: 'block', marginBottom: '4px' }}>{title || 'Title...'}</strong>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>{message || 'Message...'}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? '⏳ Sending...' : `📢 Send to ${participantCount} Participants`}
            </button>
            <button
              className="btn btn-light-outline"
              type="button"
              onClick={() => { setOpen(false); setTitle(''); setMessage(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SendAnnouncement;
