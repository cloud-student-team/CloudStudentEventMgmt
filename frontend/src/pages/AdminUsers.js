import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const token = sessionStorage.getItem('token');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch {
      toast.error('Could not load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch {
      console.error('Could not load stats');
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const changeRole = async (userId, role) => {
    try {
      await axios.put(
        `${API_URL}/admin/users/${userId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Role updated');
      fetchUsers();
      fetchStats();
    } catch {
      toast.error('Could not update role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('User deleted');
      fetchUsers();
      fetchStats();
    } catch {
      toast.error('Could not delete user');
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const roleBadgeColor = (role) => {
    if (role === 'admin') return '#7C3AED';
    if (role === 'organiser') return '#0D9488';
    return '#0EA5E9';
  };

  if (loading) return <div className="card empty-state">Loading...</div>;

  return (
    <div className="page-container">
      <div className="premium-page-shell">

        {/* Header */}
        <div className="card info-banner">
          <h2>👑 Admin Panel</h2>
          <p>Manage users, view stats and overview of all registrations.</p>
          <Link to="/admin/registrations" className="btn btn-primary" style={{ marginTop: '10px', display: 'inline-block' }}>
            📋 View All Registrations
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="card stat-card" style={{ textAlign: 'center' }}>
              <div className="card-icon" style={{ margin: '0 auto 12px' }}>👥</div>
              <h3 style={{ fontSize: '2rem', margin: '0', color: '#1d4ed8' }}>{stats.totalUsers}</h3>
              <p style={{ margin: '4px 0 0' }}>Total Users</p>
            </div>
            <div className="card stat-card" style={{ textAlign: 'center' }}>
              <div className="card-icon" style={{ margin: '0 auto 12px' }}>📅</div>
              <h3 style={{ fontSize: '2rem', margin: '0', color: '#0D9488' }}>{stats.totalEvents}</h3>
              <p style={{ margin: '4px 0 0' }}>Total Events</p>
            </div>
            <div className="card stat-card" style={{ textAlign: 'center' }}>
              <div className="card-icon" style={{ margin: '0 auto 12px' }}>📝</div>
              <h3 style={{ fontSize: '2rem', margin: '0', color: '#7C3AED' }}>{stats.totalRegistrations}</h3>
              <p style={{ margin: '4px 0 0' }}>Total Registrations</p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            style={{ flex: '2', minWidth: '200px', marginBottom: '0' }}
            type="text"
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            style={{ flex: '1', minWidth: '140px', marginBottom: '0' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="organiser">Organiser</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="select"
            style={{ flex: '1', minWidth: '140px', marginBottom: '0' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>
          <span style={{ color: '#64748b', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            {filteredUsers.length} of {users.length} users
          </span>
        </div>

        {/* Users Table */}
        <div className="card">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">No users found matching your search.</div>
          ) : (
            <table className="participants-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: `linear-gradient(135deg, ${roleBadgeColor(u.role)}, #38bdf8)`,
                          color: 'white', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem',
                          flexShrink: 0
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{u.email}</td>
                    <td>
                      <select
                        className="select"
                        style={{ marginBottom: '0', minWidth: '120px' }}
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
                        <option value="student">Student</option>
                        <option value="organiser">Organiser</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-danger" onClick={() => deleteUser(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Activity */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 16px' }}>🆕 Recent Users</h3>
              {stats.recentUsers.map((u) => (
                <div key={u.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '10px 0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div>
                    <strong style={{ display: 'block' }}>{u.name}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{u.email}</span>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem',
                    fontWeight: '700', color: 'white',
                    background: roleBadgeColor(u.role)
                  }}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ margin: '0 0 16px' }}>📅 Recent Events</h3>
              {stats.recentEvents.map((e) => (
                <div key={e.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <strong style={{ display: 'block' }}>{e.title}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {new Date(e.event_date).toLocaleDateString()} • {e.venue}
                  </span>
                  <span style={{ color: '#0D9488', fontSize: '0.85rem', display: 'block' }}>
                    by {e.organizer_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminUsers;
