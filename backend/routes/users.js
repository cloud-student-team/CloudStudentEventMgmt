const express = require('express');
const bcryptjs = require('bcryptjs'); 
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/test', (req, res) => {
  res.send('users route working');
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM app_users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM app_users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    let updatedPassword = user.password;

    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required' });
      }

      const isMatch = await bcryptjs.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      updatedPassword = await bcryptjs.hash(newPassword, 10);
    }

    const updatedUser = await pool.query(
      `UPDATE app_users
       SET name = $1,
           email = $2,
           password = $3
       WHERE id = $4
       RETURNING id, name, email, role, created_at`,
      [name || user.name, email || user.email, updatedPassword, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;