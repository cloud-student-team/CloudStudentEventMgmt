const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// GET all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM app_users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// PUT change a user's role
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!['student', 'organiser', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const result = await pool.query(
    'UPDATE app_users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Role updated', user: result.rows[0] });
});

// DELETE a user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await pool.query('DELETE FROM app_users WHERE id = $1', [req.params.id]);
  res.json({ message: 'User deleted' });
});

// GET dashboard stats
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users, events, registrations, recentUsers, recentEvents] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM app_users'),
      pool.query('SELECT COUNT(*) FROM app_events'),
      pool.query('SELECT COUNT(*) FROM app_registrations'),
      pool.query(
        `SELECT id, name, email, role, created_at 
         FROM app_users ORDER BY created_at DESC LIMIT 5`
      ),
      pool.query(
        `SELECT e.id, e.title, e.event_date, e.venue, u.name AS organizer_name
         FROM app_events e
         LEFT JOIN app_users u ON e.organizer_id = u.id
         ORDER BY e.created_at DESC LIMIT 5`
      ),
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalEvents: parseInt(events.rows[0].count),
      totalRegistrations: parseInt(registrations.rows[0].count),
      recentUsers: recentUsers.rows,
      recentEvents: recentEvents.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET all registrations overview
router.get('/registrations', authMiddleware, adminMiddleware, async (req, res) => {
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
        e.venue,
        org.name AS organizer_name
       FROM app_registrations r
       JOIN app_users u ON r.user_id = u.id
       JOIN app_events e ON r.event_id = e.id
       LEFT JOIN app_users org ON e.organizer_id = org.id
       ORDER BY r.registered_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
