import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const token = sessionStorage.getItem('token');

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(res.data);
    } catch {
      toast.error('Could not load registrations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const filteredRegistrations = registrations.filter((r) => {
    const matchSearch =
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_email.toLowerCase().includes(search.toLowerCase()) ||
      r.event_title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    const headers = ['Student Name', 'Student Email', 'Event', 'Date', 'Venue', 'Organiser', 'Status', 'Registered At'];
    const rows = filteredRegistrations.map((r) => [
      r.student_name,
      r.student_email,
      r.event_title,
      new Date(r.event_date).toLocaleDateString(),
      r.venue,
      r.organizer_name,
      r.status,
      new Date(r.registered_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin_registrations.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const statusColor = (status) => {
    if (status === 'Registered') return { background: '#dcfce7', color: '#166534' };
    if (status === 'Attended') return { background: '#dbeafe', color: '#1d4ed8' };
    if (status === 'Cancelled') return { background: '#fee2e2', color: '#b91c1c' };
    return { background: '#f1f5f9', color: '#475569' };
  };

  if (loading) return <div className="card empty-state">Loading registrations...</div>;

  return (
    <div className="page-container">
      <div className="premium-page-shell">

        {/* Header */}
        <div className="card info-banner">
          <h2>📋 Admin — Registration Overview</h2>
          <p>View all registrations across all events in the system.</p>
        </div>

        {/* Search, Filter & Export */}
        <div className="card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            style={{ flex: '2', minWidth: '200px', marginBottom: '0' }}
            type="text"
            placeholder="🔍 Search by student, email or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            style={{ flex: '1', minWidth: '140px', marginBottom: '0' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Registered">Registered</option>
            <option value="Attended">Attended</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <span style={{ color: '#64748b', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            {filteredRegistrations.length} results
          </span>
          <button className="btn btn-secondary" onClick={exportCSV}>
            ⬇️ Export CSV
          </button>
        </div>

        {/* Registrations Table */}
        <div className="card">
          {filteredRegistrations.length === 0 ? (
            <div className="empty-state">No registrations found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="participants-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Organiser</th>
                    <th>Status</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((r) => (
                    <tr key={r.registration_id}>
                      <td><strong>{r.student_name}</strong></td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{r.student_email}</td>
                      <td><strong>{r.event_title}</strong></td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {new Date(r.event_date).toLocaleDateString()}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{r.venue}</td>
                      <td style={{ color: '#0D9488', fontSize: '0.9rem' }}>{r.organizer_name}</td>
                      <td>
                        <span style={{
                          padding: '5px 12px', borderRadius: '999px',
                          fontSize: '0.82rem', fontWeight: '700',
                          ...statusColor(r.status)
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {new Date(r.registered_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminRegistrations;
