import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Profile() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }
      const res = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData((prev) => ({
        ...prev,
        name: res.data.name || '',
        email: res.data.email || '',
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.put(`${API_URL}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('✅ Profile updated successfully');
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update profile');
    }
  };

  if (loading) return <div className="card empty-state">Loading profile...</div>;

  return (
    <div className="card form-card">
      <h2 className="page-title">My Profile</h2>
      <p className="page-subtitle">Update your personal details and password settings securely.</p>

      <div className="profile-summary">
        <div className="profile-chip">
          <span>Name</span>
          <strong>{formData.name || 'Not available'}</strong>
        </div>
        <div className="profile-chip">
          <span>Email</span>
          <strong>{formData.email || 'Not available'}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="form-label">Full Name</label>
        <input className="input" type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />

        <label className="form-label">Email Address</label>
        <input className="input" type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />

        <label className="form-label">Current Password</label>
        <input className="input" type="password" name="currentPassword" placeholder="Enter current password if you want to change it" value={formData.currentPassword} onChange={handleChange} />

        <label className="form-label">New Password</label>
        <input className="input" type="password" name="newPassword" placeholder="Enter a new password (optional)" value={formData.newPassword} onChange={handleChange} />

        <button className="btn btn-primary" type="submit">Update Profile</button>
      </form>
    </div>
  );
}

export default Profile;
