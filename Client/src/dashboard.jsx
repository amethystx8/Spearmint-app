import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './assets/dashboard.css';
import "./index.css";
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Sidebar from './components/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem('username') || 'Ankur';
  
  // Check if user is logged in
  useEffect(() => {
    if (!localStorage.getItem('username')) {
      navigate('/login');
      return;
    }
  }, [navigate]);
  const [time, setTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState(0);

  // Schedules from Firestore with source tracking
  const [schedule, setSchedule] = useState([]);
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ time: '', task: '', source: 'dashboard' });

  // Task management
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Low', completed: false, source: 'dashboard' });

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchSchedules();
  }, []);

  const fetchTasks = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'tasks'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter for today's tasks and dashboard/kanban sources
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = data.filter(task => {
        const taskDate = task.date || today;
        return taskDate === today && (task.source === 'dashboard' || task.source === 'kanban' || !task.source);
      });
      
      setTasks(todayTasks);
      setCompleted(todayTasks.filter(task => task.completed).length);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Fetch schedules from Firestore with source support
  const fetchSchedules = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'schedules'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Support both dashboard and kanban sources
      const filteredSchedules = data.filter(item => 
        item.source === 'dashboard' || item.source === 'kanban' || !item.source
      );
      
      setSchedule(filteredSchedules.sort((a, b) => a.time.localeCompare(b.time)));
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  // Add schedule to Firestore with source tracking
  const handleAddSchedule = async () => {
    if (!newSchedule.time.trim() || !newSchedule.task.trim()) return;
    
    try {
      await addDoc(collection(db, 'schedules'), {
        ...newSchedule,
        createdAt: new Date(),
        date: new Date().toISOString().split('T')[0]
      });
      setNewSchedule({ time: '', task: '', source: 'dashboard' });
      setShowScheduleInput(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  // Add task to Firestore
  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        createdAt: new Date(),
        date: new Date().toISOString().split('T')[0]
      });
      setNewTask({ title: '', priority: 'Low', completed: false, source: 'dashboard' });
      setShowTaskInput(false);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !currentStatus
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  // Delete schedule
  const deleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule item?')) {
      try {
        await deleteDoc(doc(db, 'schedules', scheduleId));
        fetchSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const totalTasks = tasks.length;
  const percent = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

  const quotes = [
    'Take a deep breath.',
    'You are doing great.',
    'Pause. Sip water. Reset.',
    'Focus on progress, not perfection.',
    'Small steps lead to great achievements.',
    'You\'ve got this! 🌿'
  ];
  const mintQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

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
              <div className="section-header">
                <h3>TODAY'S TASKS</h3>
                <button 
                  onClick={() => setShowTaskInput(!showTaskInput)} 
                  className="add-btn"
                >
                  {showTaskInput ? '✕' : '+'} 
                </button>
              </div>

              {showTaskInput && (
                <div className="task-input">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                  />
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <button onClick={handleAddTask}>Add</button>
                  <button onClick={() => setShowTaskInput(false)}>Cancel</button>
                </div>
              )}

              <div className="tasks-list">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-item ${task.completed ? 'completed' : ''}`}
                    style={{
                      backgroundColor: task.priority === 'High' ? '#fdd' : task.priority === 'Medium' ? '#e5eaff' : '#c6d9c2',
                      borderRadius: '20px',
                      padding: '10px 15px',
                      marginBottom: '10px',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div onClick={() => toggleTaskCompletion(task.id, task.completed)} style={{ cursor: 'pointer', flex: 1 }}>
                      {task.completed ? '✓ ' : ''}{task.title} {task.priority === 'High' ? '🌶️🌶️' : task.priority === 'Medium' ? '🌶️' : ''}
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)} 
                      className="delete-btn"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="empty-state">
                    No tasks for today. Add some tasks to get started! 🎯
                  </div>
                )}
              </div>
            </div>

            <div className="schedule-box">
              <div className="section-header">
                <h3>TODAY'S SCHEDULE</h3>
                <button 
                  onClick={() => setShowScheduleInput(!showScheduleInput)} 
                  className="add-btn"
                >
                  {showScheduleInput ? '✕' : '+'} 
                </button>
              </div>

              <div className="schedule-list">
                {schedule.map((item) => (
                  <div key={item.id} className="schedule-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <strong>{item.time}</strong> {item.task} ✅
                      <small style={{ display: 'block', color: '#666', fontSize: '0.8em' }}>
                        from {item.source || 'dashboard'}
                      </small>
                    </div>
                    <button 
                      onClick={() => deleteSchedule(item.id)} 
                      className="delete-btn"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {schedule.length === 0 && (
                  <div className="empty-state">
                    No scheduled items for today. Set your schedule! 📅
                  </div>
                )}
              </div>

              {showScheduleInput && (
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
              <div className="progress-visual">
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
                <div className="progress-text">
                  <span className="progress-percent">{percent}%</span>
                  <span className="progress-label">{completed}/{totalTasks} tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
