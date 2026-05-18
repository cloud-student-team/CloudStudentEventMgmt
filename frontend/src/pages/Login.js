import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      const res = await axios.post(`${API_URL}/auth/login`, formData);
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('✅ Login successful');
      setTimeout(() => {
        // window.location.href = '/';
        if (res.data.user.role === 'admin') {
          window.location.href = '/admin/users';
        } else {
          window.location.href = '/';
        }
      }, 900);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-side-panel">
        <div className="hero-badge">Welcome Back</div>
        <h2>Access your event dashboard</h2>
        <p>
          Sign in to explore upcoming events, manage registrations, and keep your campus
          activities organised in one place.
        </p>

        <div className="auth-points">
          <div className="auth-point">
            <strong>For students</strong>
            Browse events, join activities, and track your registrations.
          </div>
          <div className="auth-point">
            <strong>For organisers</strong>
            Create events, manage participants, and monitor registrations.
          </div>
        </div>
      </div>

      <div className="card form-card">
        <h2 className="page-title">Login</h2>
        <p className="page-subtitle">Use your registered email address and password to continue.</p>

        <form onSubmit={handleSubmit}>
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
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button className="btn btn-primary" type="submit">
            Sign In
          </button>
        </form>

        <div className="helper-row">
          Do not have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
