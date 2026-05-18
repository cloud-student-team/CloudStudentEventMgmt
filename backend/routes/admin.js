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

module.exports = router;