import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function OrganizerRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  const fetchRegistrations = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const user = JSON.parse(sessionStorage.getItem('user'));

      if (!token || !user) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      if (user.role !== 'organiser' && user.role !== 'organizer') {
        toast.error('Only organisers can view registrations');
        navigate('/events');
        return;
      }

      const res = await axios.get('${API_URL}/registrations/organizer/all', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRegistrations(res.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Could not load registrations');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const searchText = search.toLowerCase().trim();
      const matchesSearch =
        item.event_title?.toLowerCase().includes(searchText) ||
        item.student_name?.toLowerCase().includes(searchText) ||
        item.student_email?.toLowerCase().includes(searchText) ||
        item.venue?.toLowerCase().includes(searchText);
      const matchesStatus = statusFilter === 'All' ? true : item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  const stats = useMemo(() => ({
    total: registrations.length,
    registered: registrations.filter((item) => item.status === 'Registered').length,
    attended: registrations.filter((item) => item.status === 'Attended').length,
    cancelled: registrations.filter((item) => item.status === 'Cancelled').length,
  }), [registrations]);

  if (loading) {
    return <div className="card empty-state">Loading registrations...</div>;
  }

  return (
    <div className="premium-page-shell">
      <section className="premium-hero premium-hero-registrations">
        <div className="premium-hero-copy">
          <span className="premium-kicker">Organizer insights</span>
          <h1>All student registrations</h1>
          <p>
            Track registration activity across every event, review attendee demand,
            and move between event operations with a cleaner premium overview.
          </p>

          <div className="premium-hero-actions">
            <Link to="/create-event" className="btn btn-primary link-btn">
              Create Event
            </Link>
            <Link to="/events" className="btn btn-light-outline link-btn">
              Events Directory
            </Link>
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
            placeholder="Search by event, student, email, or venue"
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
          <Link to="/" className="btn btn-light-outline link-btn">
            Home
          </Link>
        </div>
      </section>

      {filteredRegistrations.length === 0 ? (
        <div className="card empty-state premium-empty-state">No student registrations found.</div>
      ) : (
        <div className="card premium-table-shell">
          <div className="participants-table-wrapper premium-table-wrapper">
            <table className="participants-table premium-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((item) => (
                  <tr key={item.registration_id}>
                    <td>
                      <div>
                        <strong>{item.event_title}</strong>
                        <div className="table-subtext">Registration #{item.registration_id}</div>
                      </div>
                    </td>
                    <td>{item.event_date?.split('T')[0]}</td>
                    <td>{item.event_time}</td>
                    <td>{item.venue}</td>
                    <td>
                      <div className="person-cell">
                        <div className="person-avatar">
                          {(item.student_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{item.student_name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{item.student_email}</td>
                    <td>
                      <span className={`status-pill ${String(item.status || '').toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizerRegistrations;
