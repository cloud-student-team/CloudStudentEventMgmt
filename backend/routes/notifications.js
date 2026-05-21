const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all notifications for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.created_at,
        e.title AS event_title,
        e.event_date,
        e.venue
       FROM app_notifications n
       LEFT JOIN app_events e ON n.event_id = e.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET unread count for bell icon
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM app_notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT mark single notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE app_notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT mark ALL notifications as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE app_notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST send announcement to event participants (Organiser only)
router.post('/announce', authMiddleware, async (req, res) => {
  try {
    const { event_id, title, message } = req.body;
    const user = req.user;

    if (user.role !== 'organiser' && user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organisers can send announcements' });
    }

    if (!event_id || !title || !message) {
      return res.status(400).json({ message: 'event_id, title and message are required' });
    }

    // Get all registered participants for the event
    const participants = await pool.query(
      `SELECT user_id FROM app_registrations 
       WHERE event_id = $1 AND status != 'Cancelled'`,
      [event_id]
    );

    if (participants.rows.length === 0) {
      return res.status(400).json({ message: 'No participants found for this event' });
    }

    // Create notification for each participant
    const insertPromises = participants.rows.map((p) =>
      pool.query(
        `INSERT INTO app_notifications (user_id, title, message, type, event_id)
         VALUES ($1, $2, $3, 'announcement', $4)`,
        [p.user_id, title, message, event_id]
      )
    );

    await Promise.all(insertPromises);

    res.json({
      message: `Announcement sent to ${participants.rows.length} participants`,
      count: participants.rows.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
