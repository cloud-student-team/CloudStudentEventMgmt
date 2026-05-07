import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';



function MyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        if (!token) {
          toast.error('Please login first');
          setEvents([]);
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_URL}/registrations/my/events`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('My Events data:', res.data); // DEBUG

        setEvents(res.data || []);
      } catch (error) {
        console.error('My Events error:', error);
        toast.error(error.response?.data?.message || 'Could not load my events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [token]);

  const cancelRegistration = async (eventId) => {
    try {
      await axios.delete(
        `${API_URL}/registrations/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Registration cancelled');

      setEvents((prevEvents) =>
        prevEvents.filter((event) => (event.id || event.event_id) !== eventId)
      );
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.message || 'Could not cancel registration');
    }
  };

  if (loading) {
    return <div className="card empty-state">Loading my events...</div>;
  }

  return (
    <div>
      <div className="card info-banner" style={{ marginBottom: '20px' }}>
        <h2>My Events</h2>
        <p>These are the events you have joined.</p>
      </div>

      {events.length === 0 ? (
        <div className="card empty-state">
          You have not joined any events yet.
        </div>
      ) : (
        <div className="event-grid">
          {events.map((event) => {
            // 🔥 IMPORTANT DEBUG LINE
            console.log('EVENT OBJECT:', event);

            // 🔥 SAFE ID FIX (prevents undefined error)
            const eventId = event.id || event.event_id;

            return (
              <div key={eventId} className="card event-card">
                <div className="event-badge-row">
                  <span className="event-badge primary">
                    {event.event_date?.split('T')[0] || 'Date TBA'}
                  </span>
                  <span className="event-badge muted">
                    {event.event_time || 'Time TBA'}
                  </span>
                  <span className="event-badge accent">
                    {event.venue || 'Venue TBA'}
                  </span>
                </div>

                <h3>{event.title || 'Untitled Event'}</h3>
                <p>{event.description || 'No description available.'}</p>

                <div className="action-row">
                  {eventId ? (
                    <Link
                      to={`/events/${eventId}`}
                      className="btn btn-primary link-btn"
                    >
                      View Details
                    </Link>
                  ) : (
                    <button className="btn btn-disabled" disabled>
                      Invalid Event
                    </button>
                  )}

                  {eventId && (
                    <button
                      className="btn btn-danger"
                      onClick={() => cancelRegistration(eventId)}
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyEvents;