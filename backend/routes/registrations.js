const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const requireOrganiser = (req, res, next) => {
  if (req.user.role !== 'organiser' && req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Only organisers can perform this action' });
  }
  next();
};

// Organizer: all registrations for all events created by this organiser
router.get('/organizer/all', authMiddleware, requireOrganiser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          r.id AS registration_id,
          r.status,
          r.registered_at,
          u.id AS student_id,
          u.name AS student_name,
          u.email AS student_email,
          e.id AS event_id,
          e.title AS event_title,
          e.event_date,
          e.event_time,
          e.venue
       FROM app_registrations r
       JOIN app_users u ON r.user_id = u.id
       JOIN app_events e ON r.event_id = e.id
       WHERE e.organizer_id = $1
       ORDER BY e.event_date ASC, e.event_time ASC, u.name ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// My joined events
router.get('/my/events', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, r.status
       FROM app_events e
       JOIN app_registrations r ON e.id = r.event_id
       WHERE r.user_id = $1
       ORDER BY e.event_date ASC, e.event_time ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// Organizer: participants of one event
router.get('/event/:eventId/participants', authMiddleware, requireOrganiser, async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventCheck = await pool.query(
      'SELECT * FROM app_events WHERE id = $1',
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = eventCheck.rows[0];

    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to view participants for this event' });
    }

    const participants = await pool.query(
      `SELECT 
          r.id AS registration_id,
          r.status,
          r.registered_at,
          u.id AS user_id,
          u.name,
          u.email
       FROM app_registrations r
       JOIN app_users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY u.name ASC`,
      [eventId]
    );

    res.json(participants.rows);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// Organizer: update participant registration status
router.put('/organizer/registration/:registrationId/status', authMiddleware, requireOrganiser, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Registered', 'Cancelled', 'Attended'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use Registered, Cancelled, or Attended.',
      });
    }

    const checkRegistration = await pool.query(
      `SELECT r.id, e.organizer_id
       FROM app_registrations r
       JOIN app_events e ON r.event_id = e.id
       WHERE r.id = $1`,
      [registrationId]
    );

    if (checkRegistration.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (checkRegistration.rows[0].organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to update this registration' });
    }

    const updated = await pool.query(
      `UPDATE app_registrations
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, registrationId]
    );

    res.json({
      message: 'Registration status updated successfully',
      registration: updated.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// Organizer: remove participant from event
router.delete('/organizer/registration/:registrationId', authMiddleware, requireOrganiser, async (req, res) => {
  try {
    const { registrationId } = req.params;

    const checkRegistration = await pool.query(
      `SELECT r.id, e.organizer_id
       FROM app_registrations r
       JOIN app_events e ON r.event_id = e.id
       WHERE r.id = $1`,
      [registrationId]
    );

    if (checkRegistration.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (checkRegistration.rows[0].organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to remove this participant' });
    }

    await pool.query(
      'DELETE FROM app_registrations WHERE id = $1',
      [registrationId]
    );

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// Join event
router.post('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventCheck = await pool.query(
      'SELECT * FROM app_events WHERE id = $1',
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registration = await pool.query(
      `INSERT INTO app_registrations (user_id, event_id, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, eventId, 'Registered']
    );

    res.status(201).json({
      message: 'Successfully joined event',
      registration: registration.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'You already joined this event' });
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// Student: cancel own registration
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const deleted = await pool.query(
      'DELETE FROM app_registrations WHERE user_id = $1 AND event_id = $2 RETURNING *',
      [req.user.id, eventId]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({ message: 'Participation cancelled successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;