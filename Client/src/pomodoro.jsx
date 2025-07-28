import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './assets/dashboard.css';
import Sidebar from './components/Sidebar';

export default function Pomodoro() {
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    if (!localStorage.getItem('username')) {
      navigate('/login');
      return;
    }
  }, [navigate]);
  
  // Timer states
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  // Settings
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [showSettings, setShowSettings] = useState(false);
  
  // Task selection
  const [selectedTask, setSelectedTask] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  // Calculate break time (20% of pomodoro time)
  const breakTime = Math.ceil(pomodoroTime * 0.2);

  // Initialize timer with pomodoro time when settings change
  useEffect(() => {
    if (!isActive) {
      setMinutes(pomodoroTime);
      setSeconds(0);
      setIsBreak(false);
    }
  }, [pomodoroTime, isActive]);

  // Timer countdown logic
  useEffect(() => {
    let interval = null;
    
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer reached zero
            if (isBreak) {
              // Break ended - reset everything for new Pomodoro session
              setMinutes(pomodoroTime);
              setSeconds(0);
              setIsBreak(false);
              setIsActive(false);
              showNotification("Break ended! Ready for a new Pomodoro session.");
              
              // Mark task as completed if selected
              if (selectedTask) {
                markTaskAsCompleted();
              }
            } else {
              // Pomodoro ended - start break timer
              setMinutes(breakTime);
              setSeconds(0);
              setIsBreak(true);
              showNotification("Pomodoro completed! Starting break time.");
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (!isActive) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, isBreak, pomodoroTime, breakTime, selectedTask]);

  // Timer control functions
  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(pomodoroTime);
    setSeconds(0);
    setIsBreak(false);
  };

  // Notification function
  const showNotification = (message) => {
    if (Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', { body: message });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Pomodoro Timer', { body: message });
        }
      });
    }
    alert(message);
  };

  // Settings validation and update
  const updatePomodoroTime = (newTime) => {
    if (newTime < 25) {
      alert("Pomodoro time cannot be less than 25 minutes!");
      return;
    }
    if (newTime <= 0) {
      alert("Please enter a valid positive number for minutes!");
      return;
    }
    setPomodoroTime(newTime);
  };

  // Task linking functions  
  const fetchTasks = async () => {
    try {
      const { db } = await import('./firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      
      const today = new Date().toISOString().split('T')[0];
      const scheduleSnapshot = await getDocs(collection(db, 'schedules'));
      const scheduleData = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const todayTasks = scheduleData.filter(item => 
        (item.date === today || !item.date) && item.task
      );
      
      setAvailableTasks(todayTasks);
    } catch (error) {
      console.warn('Using mock data due to Firebase issue:', error);
      setAvailableTasks([
        { id: '1', task: 'Complete project proposal', completed: false },
        { id: '2', task: 'Review code changes', completed: false },
        { id: '3', task: 'Team standup meeting', completed: false },
      ]);
    }
  };

  const markTaskAsCompleted = async () => {
    if (!selectedTask) return;
    
    try {
      const { db } = await import('./firebase');
      const { updateDoc, doc } = await import('firebase/firestore');
      
      await updateDoc(doc(db, 'schedules', selectedTask.id), {
        completed: true,
        status: 'completed'
      });
      console.log('Task marked as completed');
    } catch (error) {
      console.warn('Could not update task completion:', error);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h2 className="greeting">🍅 Pomodoro Timer</h2>
            <p className="subtext">{isBreak ? 'Break time - relax and recharge' : 'Focus time - stay productive'}</p>
          </div>
          <div className="time-display">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}<br />
            {isBreak ? `Break (${breakTime} min)` : `Focus (${pomodoroTime} min)`}
          </div>
        </div>

        <div className="dashboard-grid" style={{gridTemplateColumns: '1fr', justifyItems: 'center'}}>
          <div className="task-schedule-container" style={{maxWidth: '600px', width: '100%'}}>
            {/* Single Timer Display Box */}
            <div className="task-box">
              <div className="section-header">
                <h3>TIMER</h3>
                <span className="timer-status">
                  {isActive && '⏱️ Running'}
                  {!isActive && '⏹️ Stopped'}
                </span>
              </div>

              <div className="timer-display-large">
                <div className="timer-text-big">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="timer-label">
                  {isBreak ? '☕ Break Time' : '🍅 Focus Time'}
                </div>
                {selectedTask && (
                  <div style={{marginTop: '10px', color: '#0ea5e9', fontSize: '0.9rem'}}>
                    Working on: {selectedTask.task}
                  </div>
                )}
              </div>

              <div className="timer-controls">
                <button 
                  className="control-btn start-btn" 
                  onClick={startTimer}
                  disabled={isActive}
                >
                  Start
                </button>
                <button 
                  className="control-btn pause-btn" 
                  onClick={pauseTimer}
                  disabled={!isActive}
                >
                  Pause
                </button>
                <button 
                  className="control-btn reset-btn" 
                  onClick={resetTimer}
                >
                  Reset
                </button>
              </div>

              {/* Settings and Focus On buttons */}
              <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px'}}>
                <button 
                  className="mint-button"
                  onClick={() => setShowSettings(!showSettings)}
                  style={{padding: '8px 16px'}}
                >
                  ⚙️ Configure Timer
                </button>
                
                <button 
                  className="mint-button"
                  onClick={() => setShowTaskSelector(!showTaskSelector)}
                  style={{padding: '8px 16px'}}
                >
                  📋 Focus On
                </button>
              </div>

              {/* Settings panel */}
              {showSettings && (
                <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', margin: '15px 0'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Pomodoro Duration (min):</label>
                  <input
                    type="number"
                    min="25"
                    value={pomodoroTime}
                    onChange={(e) => updatePomodoroTime(parseInt(e.target.value) || 25)}
                    disabled={isActive}
                    style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                  />
                  <small style={{color: '#6b7280', display: 'block', marginTop: '5px'}}>Break: {breakTime} min (20% of Pomodoro)</small>
                </div>
              )}

              {/* Task selector */}
              {showTaskSelector && (
                <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', margin: '15px 0'}}>
                  {availableTasks.length === 0 ? (
                    <p style={{textAlign: 'center', color: '#6b7280', margin: '0'}}>No tasks available for today</p>
                  ) : (
                    <select 
                      value={selectedTask?.id || ''} 
                      onChange={(e) => {
                        const task = availableTasks.find(t => t.id === e.target.value);
                        setSelectedTask(task || null);
                        if (task) setShowTaskSelector(false);
                      }}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    >
                      <option value="">Select a task...</option>
                      {availableTasks.map(task => (
                        <option key={task.id} value={task.id} disabled={task.completed}>
                          {task.task} {task.completed ? '(Completed)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {selectedTask && (
                    <div style={{marginTop: '10px', textAlign: 'center'}}>
                      <p style={{margin: '5px 0', color: '#0ea5e9'}}>Selected: {selectedTask.task}</p>
                      <button 
                        onClick={() => setSelectedTask(null)}
                        style={{padding: '5px 10px', fontSize: '0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}