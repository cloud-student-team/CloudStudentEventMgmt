const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { getFileUrl } = upload;

const router = express.Router();

// Helper: organiser-only access
const requireOrganiser = (req, res, next) => {
  if (req.user.role !== 'organiser' && req.user.role !== 'organizer') {
    return res.status(403).json({
      message: 'Only organisers can perform this action',
    });
  }
  next();
};

// GET all events — now includes registration_count and created_at
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          e.id,
          e.title,
          e.description,
          e.event_date,
          e.event_time,
          e.venue,
          e.poster_url,
          e.latitude,
          e.longitude,
          e.status,
          e.organizer_id,
          e.created_at,
          u.name AS organizer_name,
          COUNT(r.id) AS registration_count
       FROM app_events e
       LEFT JOIN app_users u ON e.organizer_id = u.id
       LEFT JOIN app_registrations r ON e.id = r.event_id
       GROUP BY e.id, u.name
       ORDER BY e.event_date ASC, e.event_time ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      message: 'Server error while fetching events',
      error: error.message,
    });
  }
});

// GET single event by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
          e.id,
          e.title,
          e.description,
          e.event_date,
          e.event_time,
          e.venue,
          e.poster_url,
          e.latitude,
          e.longitude,
          e.status,
          e.organizer_id,
          e.created_at,
          u.name AS organizer_name,
          u.email AS organizer_email,
          COUNT(r.id) AS registration_count
       FROM app_events e
       LEFT JOIN app_users u ON e.organizer_id = u.id
       LEFT JOIN app_registrations r ON e.id = r.event_id
       WHERE e.id = $1
       GROUP BY e.id, u.name, u.email`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      message: 'Server error while fetching event details',
      error: error.message,
    });
  }
});

// POST create event
router.post('/', authMiddleware, requireOrganiser, upload.single('poster'), async (req, res) => {
  try {
    const { title, description, event_date, event_time, venue, latitude, longitude, status } = req.body;
    if (!title || !event_date || !event_time) {
      return res.status(400).json({ message: 'Title, event date, and event time are required' });
    }
    const poster_url = getFileUrl(req.file);
    const newEvent = await pool.query(
      `INSERT INTO app_events
       (title, description, event_date, event_time, venue, organizer_id, poster_url, latitude, longitude, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        title,
        description || null,
        event_date,
        event_time,
        venue || null,
        req.user.id,
        poster_url,
        latitude || null,
        longitude || null,
        status || 'Upcoming',
      ]
    );
    res.status(201).json({ message: 'Event created successfully', event: newEvent.rows[0] });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error while creating event', error: error.message });
  }
});

// PUT update event
router.put('/:id', authMiddleware, requireOrganiser, upload.single('poster'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_time, venue, latitude, longitude, status } = req.body;
    const eventCheck = await pool.query('SELECT * FROM app_events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = eventCheck.rows[0];
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to update this event' });
    }
    const poster_url = req.file ? getFileUrl(req.file) : event.poster_url;
    const updatedEvent = await pool.query(
      `UPDATE app_events
       SET title = $1, description = $2, event_date = $3, event_time = $4,
           venue = $5, poster_url = $6, latitude = $7, longitude = $8, status = $9
       WHERE id = $10
       RETURNING *`,
      [
        title !== undefined ? title : event.title,
        description !== undefined ? description : event.description,
        event_date !== undefined ? event_date : event.event_date,
        event_time !== undefined ? event_time : event.event_time,
        venue !== undefined ? venue : event.venue,
        poster_url,
        latitude !== undefined ? latitude : event.latitude,
        longitude !== undefined ? longitude : event.longitude,
        status !== undefined ? status : event.status,
        id,
      ]
    );
    res.json({ message: 'Event updated successfully', event: updatedEvent.rows[0] });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error while updating event', error: error.message });
  }
});

// DELETE event
router.delete('/:id', authMiddleware, requireOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const eventCheck = await pool.query('SELECT * FROM app_events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = eventCheck.rows[0];
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to delete this event' });
    }
    await pool.query('DELETE FROM app_events WHERE id = $1', [id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error while deleting event', error: error.message });
  }
});

module.exports = router;
