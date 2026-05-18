import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const isOrganizer = user && (user.role === 'organiser' || user.role === 'organizer');

  return (
    <div className="home-page premium-home-page">
      <section className="hero-section premium-home-hero-wrap">
        <div className="hero-card premium-home-hero">
          <div className="hero-badge">Student Community Platform</div>
          <h1>Elevate campus events with a premium management experience</h1>
          <p>
            Discover, create, and manage student events through a more refined interface built for
            organisers, participants, and campus communities.
          </p>

          <div className="hero-actions">
            {!user && (
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            )}
            {!user && (
              <Link to="/events" className="btn btn-light-outline">
                Explore Events
              </Link>
            )}
            {user && (
              <Link to="/events" className="btn btn-primary">
                Browse Events
              </Link>
            )}
            {user && user.role === 'student' && (
              <>
                <Link to="/my/events" className="btn btn-light-outline">
                  My Events
                </Link>
                <Link to="/my/registrations" className="btn btn-light-outline">
                  My Registrations
                </Link>
              </>
            )}
            {user && isOrganizer && (
              <>
                <Link to="/create-event" className="btn btn-light-outline">
                  Create Event
                </Link>
                <Link to="/organizer-registrations" className="btn btn-secondary">
                  Registration Hub
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="premium-home-nav-grid">
        <Link to="/" className="premium-home-link-card">
          <span>Overview</span>
          <strong>Home</strong>
          <p>Jump back to the main dashboard and featured actions.</p>
        </Link>
        <Link to="/events" className="premium-home-link-card">
          <span>Explore</span>
          <strong>Events</strong>
          <p>Browse all upcoming and past campus experiences.</p>
        </Link>
        {user && (
          <Link to="/profile" className="premium-home-link-card">
            <span>Account</span>
            <strong>Profile</strong>
            <p>Update your personal details and preferences.</p>
          </Link>
        )}
        {user && isOrganizer && (
          <Link to="/organizer-registrations" className="premium-home-link-card">
            <span>Operations</span>
            <strong>Organizer Registrations</strong>
            <p>Review every registration in one polished admin view.</p>
          </Link>
        )}
      </section>

      <section className="stats-grid">
        <div className="card stat-card premium-stat-card">
          <div className="card-icon">✨</div>
          <h3>Premium Workflow</h3>
          <p>Cleaner navigation and elevated visuals make the platform feel more polished end to end.</p>
        </div>
        <div className="card stat-card premium-stat-card">
          <div className="card-icon">👥</div>
          <h3>Participant Visibility</h3>
          <p>Organisers can review attendance activity with better scanning and status control.</p>
        </div>
        <div className="card stat-card premium-stat-card">
          <div className="card-icon">📈</div>
          <h3>Organizer Insights</h3>
          <p>Registration counts and event operations now feel more like a modern admin product.</p>
        </div>
      </section>

      <section className="card info-banner premium-info-banner">
        <h2>{user ? `Welcome back, ${user.name}` : 'Everything you need in one premium place'}</h2>
        <p>
          {user
            ? user.role === 'student'
              ? 'Browse events, track joined experiences, and move through a cleaner campus event flow.'
              : 'Create premium event listings, manage participants, and keep registrations organised with confidence.'
            : 'Create an account to join events as a student, or sign in as an organiser to unlock creation and registration management.'}
        </p>
      </section>

      <section className="dashboard-grid">
        <div className="card dashboard-card premium-dashboard-card">
          <div className="card-icon">🔎</div>
          <h3>Browse Events</h3>
          <p>View dates, venues, and details through a cleaner event discovery experience.</p>
          <Link to="/events" className="btn btn-primary">
            View Events
          </Link>
        </div>

        {user && user.role === 'student' && (
          <div className="card dashboard-card premium-dashboard-card">
            <div className="card-icon">📝</div>
            <h3>My Registrations</h3>
            <p>Track joined events and manage attendance from your personalised dashboard.</p>
            <Link to="/my/events" className="btn btn-secondary">
              My Events
            </Link>
          </div>
        )}

        {user && isOrganizer && (
          <>
            <div className="card dashboard-card premium-dashboard-card">
              <div className="card-icon">➕</div>
              <h3>Create Event</h3>
              <p>Publish high-end event listings with scheduling, location, and presentation details.</p>
              <Link to="/create-event" className="btn btn-primary">
                Create Event
              </Link>
            </div>

            <div className="card dashboard-card premium-dashboard-card">
              <div className="card-icon">📊</div>
              <h3>Manage Registrations</h3>
              <p>Review registration activity and participant information through a more premium command center.</p>
              <Link to="/organizer-registrations" className="btn btn-secondary">
                View Registrations
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Home;
