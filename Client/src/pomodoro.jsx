import { useState, useEffect } from 'react';
import './assets/pomodoro.css';

export default function Pomodoro() {
  const name = localStorage.getItem('username') || 'Ankur';
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev < 59) return prev + 1;
        setMinutes(m => m + 1);
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>Hey {name}!</h2>
        <ul>
          <li>🏠 Dashboard</li>
          <li>📅 To do</li>
          <li className="active">⏱ Pomodoro</li>
          <li>⚙️ Settings</li>
        </ul>
      </aside>

      <main className="main-content pomodoro-view">
        <p className="focus-prompt">what do you wanna focus on today?</p>
        <div className="pomodoro-clock">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </main>
    </div>
  );
}