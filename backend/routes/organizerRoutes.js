const express = require('express');
const router = express.Router();
const pool = require('../db');  
const authMiddleware = require('../middleware/authMiddleware');

// Only organisers can manage participants
function isOrganiser(req, res, next) {
  if (!req.user || req.user.role !== 'organiser') {
    return res.status(403).json({ message: 'Access denied. Organisers only.' });
  }
  next();
}

/*
  GET participants for a specific event
*/
router.get(
  '/events/:eventId/participants',
  authenticateToken,
  isOrganiser,
  async (req, res) => {
    const { eventId } = req.params;
    const organiserId = req.user.id;

    try {
      // Check event belongs to logged-in organiser
      const eventCheck = await pool.query(
        'SELECT * FROM app_events WHERE id = $1 AND organizer_id = $2',
        [eventId, organiserId]
      );

      if (eventCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found or not authorised.' });
      }

      const result = await pool.query(
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
         ORDER BY r.registered_at DESC`,
        [eventId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/*
  UPDATE registration status
  Example statuses: Registered, Cancelled, Attended
*/
router.put(
  '/registrations/:registrationId/status',
  authenticateToken,
  isOrganiser,
  async (req, res) => {
    const { registrationId } = req.params;
    const { status } = req.body;
    const organiserId = req.user.id;

    const allowedStatuses = ['Registered', 'Cancelled', 'Attended'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use Registered, Cancelled, or Attended.'
      });
    }

    try {
      // Ensure registration belongs to organiser's event
      const checkQuery = await pool.query(
        `SELECT r.id
         FROM app_registrations r
         JOIN app_events e ON r.event_id = e.id
         WHERE r.id = $1 AND e.organizer_id = $2`,
        [registrationId, organiserId]
      );

      if (checkQuery.rows.length === 0) {
        return res.status(404).json({
          message: 'Registration not found or not authorised.'
        });
      }

      const updateQuery = await pool.query(
        `UPDATE app_registrations
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, registrationId]
      );

      res.json({
        message: 'Registration status updated successfully',
        registration: updateQuery.rows[0]
      });
    } catch (error) {
      console.error('Error updating registration status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/*
  DELETE / REMOVE participant from event
*/
router.delete(
  '/registrations/:registrationId',
  authenticateToken,
  isOrganiser,
  async (req, res) => {
    const { registrationId } = req.params;
    const organiserId = req.user.id;

    try {
      // Ensure registration belongs to organiser's event
      const checkQuery = await pool.query(
        `SELECT r.id
         FROM app_registrations r
         JOIN app_events e ON r.event_id = e.id
         WHERE r.id = $1 AND e.organizer_id = $2`,
        [registrationId, organiserId]
      );

      if (checkQuery.rows.length === 0) {
        return res.status(404).json({
          message: 'Registration not found or not authorised.'
        });
      }

      await pool.query(
        'DELETE FROM app_registrations WHERE id = $1',
        [registrationId]
      );

      res.json({ message: 'Participant removed successfully' });
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;