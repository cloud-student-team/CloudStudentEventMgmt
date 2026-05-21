import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';
import SendAnnouncement from '../components/SendAnnouncement';

function Participants() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchParticipants = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const user = JSON.parse(sessionStorage.getItem('user'));

      if (!token || !user) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      if (user.role !== 'organiser' && user.role !== 'organizer') {
        toast.error('Only organisers can view participants');
        navigate('/events');
        return;
      }

      const eventRes = await axios.get(`${API_URL}/events/${eventId}`);
      setEventTitle(eventRes.data.title || 'Event');

      const res = await axios.get(
        `${API_URL}/registrations/event/${eventId}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setParticipants(res.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Could not load participants');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleStatusChange = async (registrationId, newStatus) => {
    try {
      const token = sessionStorage.getItem('token');

      await axios.put(
        `${API_URL}/registrations/organizer/registration/${registrationId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Registration status updated');
      fetchParticipants();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Could not update registration status');
    }
  };

  const handleRemoveParticipant = async (registrationId) => {
    const confirmDelete = window.confirm('Are you sure you want to remove this participant from the event?');
    if (!confirmDelete) return;

    try {
      const token = sessionStorage.getItem('token');

      await axios.delete(
        `${API_URL}/registrations/organizer/registration/${registrationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Participant removed successfully');
      fetchParticipants();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Could not remove participant');
    }
  };

  const handleExportCSV = () => {
    if (!participants || participants.length === 0) {
      toast.info('No participants to export');
      return;
    }

    const headers = ['Registration ID', 'User ID', 'Name', 'Email', 'Status', 'Registered At'];

    const rows = participants.map((participant) => [
      participant.registration_id,
      participant.user_id,
      `"${participant.name || ''}"`,
      `"${participant.email || ''}"`,
      `"${participant.status || ''}"`,
      `"${participant.registered_at ? new Date(participant.registered_at).toLocaleString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `event_${eventId}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = useMemo(() => {
    return participants.filter((participant) => {
      const searchText = search.toLowerCase().trim();
      const matchesSearch =
        participant.name?.toLowerCase().includes(searchText) ||
        participant.email?.toLowerCase().includes(searchText) ||
        String(participant.user_id || '').includes(searchText);
      const matchesStatus = statusFilter === 'All' ? true : participant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [participants, search, statusFilter]);

  const stats = useMemo(() => ({
    total: participants.length,
    registered: participants.filter((item) => item.status === 'Registered').length,
    attended: participants.filter((item) => item.status === 'Attended').length,
    cancelled: participants.filter((item) => item.status === 'Cancelled').length,
  }), [participants]);

  if (loading) {
    return <div className="card empty-state">Loading participants...</div>;
  }

  return (
    <div className="premium-page-shell">
      <section className="premium-hero premium-hero-participants">
        <div className="premium-hero-copy">
          <span className="premium-kicker">Participant control center</span>
          <h1>{eventTitle || 'Event'} participants</h1>
          <p>
            Review attendee activity, update statuses, export participant data,
            and keep the event roster polished from one premium dashboard.
          </p>

          <div className="premium-hero-actions">
            <Link to="/events" className="btn btn-light-outline link-btn">
              Back to Events
            </Link>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="premium-hero-panel">
          <div className="mini-stat-grid">
            <div className="mini-stat-card"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="mini-stat-card"><span>Registered</span><strong>{stats.registered}</strong></div>
            <div className="mini-stat-card"><span>Attended</span><strong>{stats.attended}</strong></div>
            <div className="mini-stat-card"><span>Cancelled</span><strong>{stats.cancelled}</strong></div>
          </div>
        </div>
      </section>

      <section className="card premium-filter-card">
        <div className="filters-grid premium-filters-grid">
          <input
            className="input premium-input"
            type="text"
            placeholder="Search by name, email or user ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select premium-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Registered">Registered</option>
            <option value="Attended">Attended</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <Link to="/organizer-registrations" className="btn btn-light-outline link-btn">
            All Registrations
          </Link>
        </div>
      </section>

      {filteredParticipants.length === 0 ? (
        <div className="card empty-state premium-empty-state">
          No participants match the current filters for this event.
        </div>
      ) : (
        <div className="card premium-table-shell">
          <div className="participants-table-wrapper premium-table-wrapper">
            <table className="participants-table premium-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Registered At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant) => (
                  <tr key={participant.registration_id}>
                    <td>{participant.user_id}</td>
                    <td>
                      <div className="person-cell">
                        <div className="person-avatar">
                          {(participant.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{participant.name || 'Unknown participant'}</strong>
                          <div className="table-subtext">Registration #{participant.registration_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{participant.email}</td>
                    <td>
                      <select
                        className="select premium-table-select"
                        value={participant.status}
                        onChange={(e) => handleStatusChange(participant.registration_id, e.target.value)}
                      >
                        <option value="Registered">Registered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Attended">Attended</option>
                      </select>
                    </td>
                    <td>
                      {participant.registered_at
                        ? new Date(participant.registered_at).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRemoveParticipant(participant.registration_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <SendAnnouncement
        eventId={eventId}
        eventTitle={eventTitle}
        participantCount={participants.length}
      />
    </div>
  );
}

export default Participants;
