import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import Register from './pages/Register';
import Login from './pages/Login';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import MyEvents from './pages/MyEvents';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Participants from './pages/Participants';
import OrganizerRegistrations from './pages/OrganizerRegistrations';
import Profile from './pages/Profile';
import EventDetails from './pages/EventDetails';
import ProtectedRoute from './components/ProtectedRoute';
import MyRegistrations from './pages/MyRegistrations';
import AdminUsers from './pages/AdminUsers';
import AdminRegistrations from './pages/AdminRegistrations';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Notifications from './pages/Notifications';
import API_URL from './config/api';

function Navbar({ user, setUser }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch unread notification count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const token = sessionStorage.getItem('token');
    axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setUnreadCount(res.data.count))
      .catch(() => { });
  }, [user]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const isOrganizer = user && (user.role === 'organiser' || user.role === 'organizer');

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-link">CloudEvents</Link>
      </div>

      <div className="nav-links">
        {!user && <Link to="/register">Register</Link>}
        {!user && <Link to="/login">Login</Link>}

        <Link to="/">Home</Link>

        {user && <Link to="/profile">Profile</Link>}

        {user && user.role === 'student' && (
          <>
            <Link to="/my/events">My Events</Link>
            <Link to="/my/registrations">My Registrations</Link>
          </>
        )}

        {user && isOrganizer && (
          <>
            <Link to="/create-event">Create Event</Link>
            <Link to="/organizer-registrations">All Registrations</Link>
            <Link to="/organizer-dashboard">Dashboard</Link>
          </>
        )}

        {user && user.role === 'admin' && (
          <Link to="/admin/users">Manage Users</Link>
        )}

        {/* 🔔 Notification Bell */}
        {user && (
          <Link to="/notifications" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-8px',
                background: '#dc2626', color: 'white',
                borderRadius: '50%', width: '18px', height: '18px',
                fontSize: '0.68rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}

        {user && (
          <>
            <span className="welcome-text">Hi, {user.name}</span>
            <button className="btn btn-light" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const storedUser = sessionStorage.getItem('user');
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  useEffect(() => {
    const syncUser = () => {
      const stored = sessionStorage.getItem('user');
      setUser(stored ? JSON.parse(stored) : null);
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('focus', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('focus', syncUser);
    };
  }, []);

  return (
    <div className="app-shell">
      <Navbar user={user} setUser={setUser} />

      <main className="page-container">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={<Navigate to="/" replace />} />
          <Route path="/events/:id" element={<EventDetails />} />

          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          <Route path="/my/events" element={
            <ProtectedRoute allowedRoles={['student']}><MyEvents /></ProtectedRoute>
          } />

          <Route path="/my/registrations" element={
            <ProtectedRoute allowedRoles={['student']}><MyRegistrations /></ProtectedRoute>
          } />

          <Route path="/create-event" element={
            <ProtectedRoute allowedRoles={['organiser', 'organizer']}><CreateEvent /></ProtectedRoute>
          } />

          <Route path="/participants/:eventId" element={
            <ProtectedRoute allowedRoles={['organiser', 'organizer']}><Participants /></ProtectedRoute>
          } />

          <Route path="/organizer-registrations" element={
            <ProtectedRoute allowedRoles={['organiser', 'organizer']}><OrganizerRegistrations /></ProtectedRoute>
          } />

          <Route path="/organizer-dashboard" element={
            <ProtectedRoute allowedRoles={['organiser', 'organizer']}><OrganizerDashboard /></ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>
          } />

          <Route path="/admin/registrations" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminRegistrations /></ProtectedRoute>
          } />
        </Routes>
      </main>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
