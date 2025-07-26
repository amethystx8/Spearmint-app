import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './assets/home.css';
import "./index.css";

function Home() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    if (name.trim() !== '') {
      localStorage.setItem('username', name);
      navigate('/quiz');
    }
  };

  return (
    <div className="home-container">
      <h1>Welcome to Spearmint!</h1>
      <h2>Task Management for EFD</h2>
      <p>What should we call you?</p>
      <input
        className="name-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <p className="minty-text">Stay Minty!</p>
      <button className="quiz-button" onClick={handleStart}>
        Take Quiz
      </button>
    </div>
  );
}

export default Home;