import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('token');

  const fetchMyRegistrations = async () => {
    try {
      const res = await axios.get('${API_URL}/registrations/my/events', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('My registrations:', res.data);
      setRegistrations(res.data || []);
    } catch (error) {
      console.error('My registrations error:', error);
      toast.error(error.response?.data?.message || 'Could not load registrations');
    } finally {
      setLoading(false);
    }
  };

  const cancelRegistration = async (eventId) => {
    const confirmed = window.confirm('Cancel this registration?');
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/registrations/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Registration cancelled');
      setRegistrations((prev) => prev.filter((item) => item.id !== eventId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not cancel registration');
    }
  };

  useEffect(() => {
    fetchMyRegistrations();
  }, []);

  if (loading) {
    return <div className="card empty-state">Loading your registrations...</div>;
  }

  return (
    <div>
      <div className="card info-banner" style={{ marginBottom: '20px' }}>
        <h2>My Registrations</h2>
        <p>View your own event registrations and manage your participation.</p>
      </div>

      {registrations.length === 0 ? (
        <div className="card empty-state">
          You have not registered for any events yet.
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {registrations.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.event_date?.split('T')[0] || 'Date TBA'}</td>
                  <td>{item.event_time || 'Time TBA'}</td>
                  <td>{item.venue || 'Venue TBA'}</td>
                  <td>{item.status || 'Registered'}</td>
                  <td>
                    <Link
                      to={`/events/${item.id}`}
                      className="btn btn-primary link-btn"
                    >
                      View
                    </Link>

                    <button
                      className="btn btn-danger"
                      onClick={() => cancelRegistration(item.id)}
                      style={{ marginLeft: '8px' }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyRegistrations;