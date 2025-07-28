import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './assets/signup.css';
import axios from 'axios';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/users/register', formData);
      alert('User registered successfully! Please login to continue.');
      setFormData({
        fullname: '',
        username: '',
        email: '',
        password: ''
      });
      navigate('/login'); // Redirect to login after successful signup
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed!');
      }
      console.error(err);
    }
  };

  return (
    <div className="signup-container">
      <h1>Welcome to Spearmint!</h1>
      <h3>Task Management for EFD</h3>
      <form className="signup-form" onSubmit={handleSubmit}>
        <label>What should we call you?</label>
        <input
          name="fullname"
          type="text"
          placeholder="Your Full Name"
          value={formData.fullname}
          onChange={handleChange}
          required
        />

        <label>Give us your email address</label>
        <input
          name="email"
          type="email"
          placeholder="you@you.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Set your username</label>
        <input
          name="username"
          type="text"
          placeholder="mintyzen"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label>Set your password</label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Register</button>
        {error && <div className="error-message">{error}</div>}
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account? <a href="/login" style={{ color: '#4CAF50', textDecoration: 'none' }}>Login here</a>
      </p>
    </div>
  );
}