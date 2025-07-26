import { useState } from 'react';
import axios from 'axios';
import './assets/signup.css'; // Reuse signup styles

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/users/login', formData);
      alert(`Welcome back, ${res.data.fullname}!`);
      localStorage.setItem('username', res.data.username);
    } catch (err) {
      console.error(err);
      alert('Login failed! Please check your credentials.');
    }
  };

  return (
    <div className="signup-container">
      <h1>Welcome back to Spearmint!</h1>
      <h3>Task Management for EFD</h3>
      <form className="signup-form" onSubmit={handleSubmit}>
        <label>Username</label>
        <input
          name="username"
          type="text"
          placeholder="Your username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="Your password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}