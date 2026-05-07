import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  const user = JSON.parse(sessionStorage.getItem('user'));
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    console.log('Event ID:', id);

    if (!id || id === 'undefined' || isNaN(Number(id))) {
      toast.error('Invalid event ID');
      setLoading(false);
      return;
    }

    const fetchEventDetails = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/events/${id}`
        );
        setEvent(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Could not load event details');
      } finally {
        setLoading(false);
      }
    };

    const fetchJoinedEvents = async () => {
      try {
        if (!token) return;

        const res = await axios.get(
          '${API_URL}/registrations/my/events',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const joinedIds = res.data.map((e) => e.id);
        setAlreadyJoined(joinedIds.includes(Number(id)));
      } catch (error) {
        setAlreadyJoined(false);
      }
    };

    fetchEventDetails();
    fetchJoinedEvents();
  }, [id, token]);

  const joinEvent = async () => {
    try {
      await axios.post(
        `${API_URL}/registrations/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Joined successfully');
      setAlreadyJoined(true);
    } catch (error) {
      toast.error('Join failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div>
      <h2>{event.title}</h2>
      <p>{event.description}</p>

      <Link to="/events">Back</Link>

      {!alreadyJoined && (
        <button onClick={joinEvent}>Join Event</button>
      )}
    </div>
  );
}

export default EventDetails;