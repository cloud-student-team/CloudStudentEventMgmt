import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
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

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const isOrganizer =
    user && (user.role === 'organiser' || user.role === 'organizer');

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          CloudEvents
        </Link>
      </div>

      <div className="nav-links">
        {!user && <Link to="/register">Register</Link>}
        {!user && <Link to="/login">Login</Link>}

        <Link to="/">Home</Link>
        <Link to="/events">Events</Link>

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
          </>
        )}

        {user && (
          <>
            <span className="welcome-text">Hi, {user.name}</span>
            <button className="btn btn-light" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = sessionStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
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
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={<Events />} />
       
        


          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my/events"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyEvents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my/registrations"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-event"
            element={
              <ProtectedRoute allowedRoles={['organiser', 'organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/participants/:eventId"
            element={
              <ProtectedRoute allowedRoles={['organiser', 'organizer']}>
                <Participants />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer-registrations"
            element={
              <ProtectedRoute allowedRoles={['organiser', 'organizer']}>
                <OrganizerRegistrations />
              </ProtectedRoute>
            }
          />
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