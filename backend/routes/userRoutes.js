// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// GET profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM app_users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// UPDATE profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // check if email already used by another user
    const existingUser = await pool.query(
      'SELECT id FROM app_users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);

      const updatedUser = await pool.query(
        `UPDATE app_users
         SET name = $1, email = $2, password = $3
         WHERE id = $4
         RETURNING id, name, email, role, created_at`,
        [name, email, hashedPassword, userId]
      );

      return res.json({
        message: 'Profile updated successfully',
        user: updatedUser.rows[0]
      });
    } else {
      const updatedUser = await pool.query(
        `UPDATE app_users
         SET name = $1, email = $2
         WHERE id = $3
         RETURNING id, name, email, role, created_at`,
        [name, email, userId]
      );

      return res.json({
        message: 'Profile updated successfully',
        user: updatedUser.rows[0]
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

module.exports = router;