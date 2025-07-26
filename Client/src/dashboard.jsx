import { useState, useEffect } from 'react';
import './assets/dashboard.css';
import "./index.css";
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export default function Dashboard() {
  const name = localStorage.getItem('username') || 'Ankur';
  const [time, setTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState(0);

  // Schedules from Firestore
  const [schedule, setSchedule] = useState([]);
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ time: '', task: '' });

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchSchedules();
  }, []);

  const fetchTasks = async () => {
    const snapshot = await getDocs(collection(db, 'tasks'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTasks(data);
    setCompleted(data.filter(task => task.completed).length);
  };

  // Fetch schedules from Firestore
  const fetchSchedules = async () => {
    const snapshot = await getDocs(collection(db, 'schedules'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSchedule(data);
  };

  // Add schedule to Firestore
  const handleAddSchedule = async () => {
    if (!newSchedule.time.trim() || !newSchedule.task.trim()) return;
    await addDoc(collection(db, 'schedules'), { ...newSchedule });
    setNewSchedule({ time: '', task: '' });
    setShowScheduleInput(false);
    fetchSchedules();
  };

  const totalTasks = tasks.length;
  const percent = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

  const quotes = [
    'Take a deep breath.',
    'You are doing great.',
    'Pause. Sip water. Reset.',
  ];
  const mintQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const handleLogout = () => {
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-wrapper">
      <div className="sidebar">
        <ul>
          <li>🏠 Dashboard</li>
          <li>📅 To do</li>
          <li>⏱ Pomodoro</li>
          <li>⚙️ Settings</li>
        </ul>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h2 className="greeting">Hey {name}!</h2>
            <p className="subtext">productivity 100% mint-certified</p>
          </div>
          <div className="time-display">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />
            {time.toDateString()}
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="task-schedule-container">
            <div className="task-box">
              <h3>TODAY’S TASKS</h3>
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: task.priority === 'High' ? '#fdd' : task.priority === 'Medium' ? '#e5eaff' : '#c6d9c2',
                    borderRadius: '20px',
                    padding: '10px 15px',
                    marginBottom: '10px',
                    fontWeight: 'bold'
                  }}>
                  {task.title} {task.priority === 'High' ? '🌶️🌶️' : task.priority === 'Medium' ? '🌶️' : ''}
                </div>
              ))}
            </div>
            <div className="schedule-box">
              <h3>TODAY’S SCHEDULE</h3>
              {schedule.map((item, i) => (
                <div key={i} className="schedule-item">
                  <strong>{item.time}</strong> {item.task} ✅
                </div>
              ))}
              {showScheduleInput ? (
                <div className="schedule-input">
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={e => setNewSchedule(s => ({ ...s, time: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Task"
                    value={newSchedule.task}
                    onChange={e => setNewSchedule(s => ({ ...s, task: e.target.value }))}
                  />
                  <button onClick={handleAddSchedule}>Add</button>
                  <button onClick={() => setShowScheduleInput(false)}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowScheduleInput(true)}>Set Today's Schedule</button>
              )}
            </div>
          </div>

          <div className="utility-box">
            <div>
              <h3>Need a Mint?</h3>
              <button onClick={() => alert(mintQuote)} className="mint-button">
                🌿 NEED A MINT
              </button>
            </div>
            <div className="progress-chart">
              <h3>Progress</h3>
              <svg width="100" height="100">
                <circle cx="50" cy="50" r="40" className="progress-bg" />
                <circle
                  cx="50" cy="50"
                  r="40"
                  className="progress-fg"
                  strokeDasharray={`${percent * 2.5} 999`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <p>{percent}%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}