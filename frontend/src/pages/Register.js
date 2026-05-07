import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/auth/register`, formData);
      toast.success(response.data.message || '🎉 Registration successful!');
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1100);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Registration failed'
      );
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-side-panel">
        <div className="hero-badge">Get Started</div>
        <h2>Create your account</h2>
        <p>
          Join the platform to discover events, track participation, and manage campus activities
          with a cleaner and more organised workflow.
        </p>

        <div className="auth-points">
          <div className="auth-point">
            <strong>Student account</strong>
            Join events quickly and keep all your registrations in one place.
          </div>
          <div className="auth-point">
            <strong>Organiser account</strong>
            Create and manage events, participants, and announcements efficiently.
          </div>
        </div>
      </div>

      <div className="card form-card">
        <h2 className="page-title">Create Account</h2>
        <p className="page-subtitle">Fill in your details to set up your access.</p>

        <form onSubmit={handleSubmit}>
          <label className="form-label">Full Name</label>
          <input
            className="input"
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label className="form-label">Email Address</label>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label className="form-label">Password</label>
          <input
            className="input"
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label className="form-label">Role</label>
          <select className="select" name="role" value={formData.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="organiser">Organiser</option>
          </select>

          <button className="btn btn-primary" type="submit">
            Create Account
          </button>
        </form>

        <div className="helper-row">
          Already registered? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
