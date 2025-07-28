import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './assets/dashboard.css';
import "./index.css";
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import Sidebar from './components/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Friend';
  
  // Check if user is logged in
  useEffect(() => {
    const username = localStorage.getItem('username');
    const user = localStorage.getItem('user');
    console.log('Dashboard auth check:', { username, user }); // Debug log
    if (!username) {
      console.log('No username found, redirecting to login');
      localStorage.clear(); // Clear any invalid session data
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Helper function to get user safely
  const getUser = () => {
    const userData = localStorage.getItem('user');
    const username = localStorage.getItem('username');
    
    // If no user data but we have username, create a user object with username as uid
    if (!userData && username) {
      console.log('No user object found, creating one with username as uid');
      return { uid: username, username: username }; // Temporary fallback
    }
    
    if (!userData) {
      console.error('No user data found in localStorage');
      return null;
    }
    
    try {
      const user = JSON.parse(userData);
      if (!user.uid) {
        console.log('User data missing uid, using username as uid');
        user.uid = user.username || username; // Fallback to username
      }
      return user;
    } catch (error) {
      console.error('Invalid user data in localStorage:', error);
      return null;
    }
  };

  // Core state
  const [time, setTime] = useState(new Date());
  const [isBreatherMode, setIsBreatherMode] = useState(false);
  
  // Today's Schedule state
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  
  // Pomodoro Summary state
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  
  // Kanban Summary state
  const [kanbanSummary, setKanbanSummary] = useState({
    todo: 0,
    doing: 0,
    done: 0
  });
  
  // Mental Well-being state
  const [journalEntry, setJournalEntry] = useState({
    feeling: '',
    gratitude: '',
    submitted: false
  });

  // Store submitted journal data for display
  const [submittedJournalData, setSubmittedJournalData] = useState(null);

  // Mood tracker state
  const [selectedMood, setSelectedMood] = useState('');
  
  // Schedule management state
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    time: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingTask, setEditingTask] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  // Daily affirmation
  const affirmations = [
    "You are capable of amazing things! ✨",
    "Every small step counts toward your goals 🌱",
    "You have the strength to handle whatever comes your way 💪",
    "Progress, not perfection, is what matters 🎯",
    "You are worthy of kindness, especially from yourself 💚",
    "Your efforts today are building tomorrow's success 🌟",
    "It's okay to take breaks - rest is productive too 🌿",
    "You're doing better than you think you are 🌈"
  ];
  
  const [dailyAffirmation] = useState(
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );

  // Positive reinforcement messages
  const reinforcements = [
    "You're on a roll today! 🔥",
    "Crushing it as always! 💯",
    "Your focus is inspiring! ⭐",
    "Making great progress! 🚀",
    "You've got this! 💪",
    "Mint-certified productivity! 🌿"
  ];

  const [reinforcement] = useState(
    Math.random() > 0.3 ? reinforcements[Math.floor(Math.random() * reinforcements.length)] : ""
  );

  // Time updates
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Data fetching on mount
  useEffect(() => {
    fetchTodaysSchedule();
    fetchPomodoroSessions();
    fetchKanbanSummary();
    checkJournalStatus();
    setupAlertSystem();
  }, []);

  // Alert system for upcoming tasks
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
      
      todaysSchedule.forEach(task => {
        if (!task.completed && task.time) {
          const [taskHour, taskMinute] = task.time.split(':').map(Number);
          const taskTime = taskHour * 60 + taskMinute;
          const timeDiff = taskTime - currentTime;
          
          // 5-minute alert
          if (timeDiff === 5 && !alerts.includes(task.id)) {
            setAlerts(prev => [...prev, task.id]);
            showTaskAlert(task);
          }
        }
      });
    };

    const interval = setInterval(checkAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [todaysSchedule, alerts]);

  const setupAlertSystem = () => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const showTaskAlert = (task) => {
    // Browser notification
    if (Notification.permission === "granted") {
      new Notification("Upcoming Task", {
        body: `"${task.task}" is starting in 5 minutes at ${formatTime12Hour(task.time)}`,
        icon: "🔔"
      });
    }
    
    // Dashboard alert
    alert(`⏰ Reminder: "${task.task}" is starting in 5 minutes at ${formatTime12Hour(task.time)}`);
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Fetch today's schedule
  const fetchTodaysSchedule = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const user = getUser();
      if (!user) return;
      
      const snapshot = await getDocs(
        query(
          collection(db, 'schedules'),
          where('userId', '==', user.uid),
          where('date', '==', today)
        )
      );
      
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by time
      const sortedData = data.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      
      setTodaysSchedule(sortedData);
    } catch (error) {
      console.warn('Using mock schedule data:', error);
      setTodaysSchedule([
        { id: '1', time: '09:00', task: 'Morning planning', completed: false },
        { id: '2', time: '10:30', task: 'Project work', completed: false },
        { id: '3', time: '14:00', task: 'Team meeting', completed: true },
        { id: '4', time: '16:00', task: 'Review tasks', completed: false }
      ]);
    }
  };

  // Add new schedule task
  const addScheduleTask = async () => {
    if (!newTask.title.trim() || !newTask.time) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const user = getUser();
      if (!user) return;
      
      // Check for time slot conflicts
      const existingTasksSnapshot = await getDocs(
        query(
          collection(db, 'schedules'),
          where('userId', '==', user.uid),
          where('date', '==', new Date().toISOString().split('T')[0]), // Always check today's date
          where('time', '==', newTask.time)
        )
      );

      if (!existingTasksSnapshot.empty) {
        alert('A task is already scheduled for this time slot');
        return;
      }

      await addDoc(collection(db, 'schedules'), {
        userId: user.uid,
        task: newTask.title,
        time: newTask.time,
        date: new Date().toISOString().split('T')[0], // Always use today's date
        completed: false,
        createdAt: new Date()
      });

      setNewTask({ title: '', time: '', date: new Date().toISOString().split('T')[0] });
      setShowAddSchedule(false);
      fetchTodaysSchedule();
      alert('Task added successfully! ✨');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  // Edit schedule task
  const editScheduleTask = async (taskId, updatedData) => {
    try {
      const user = getUser();
      if (!user) return;
      
      // Check for time slot conflicts if time is being changed
      if (updatedData.time) {
        const existingTasksSnapshot = await getDocs(
          query(
            collection(db, 'schedules'),
            where('userId', '==', user.uid),
            where('date', '==', new Date().toISOString().split('T')[0]), // Always use today's date
            where('time', '==', updatedData.time)
          )
        );

        const conflictingTasks = existingTasksSnapshot.docs.filter(doc => doc.id !== taskId);
        if (conflictingTasks.length > 0) {
          alert('A task is already scheduled for this time slot');
          return;
        }
      }

      await updateDoc(doc(db, 'schedules', taskId), {
        ...updatedData,
        updatedAt: new Date()
      });

      setEditingTask(null);
      fetchTodaysSchedule();
      alert('Task updated successfully! ✨');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  // Fetch Pomodoro sessions count for today
  const fetchPomodoroSessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // This would typically fetch from a pomodoro sessions collection
      // For now, using localStorage or mock data
      const sessions = localStorage.getItem(`pomodoro_sessions_${today}`) || 0;
      setPomodoroSessions(parseInt(sessions));
    } catch (error) {
      console.warn('Could not fetch Pomodoro sessions:', error);
      setPomodoroSessions(0);
    }
  };

  // Fetch Kanban task summary
  const fetchKanbanSummary = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'tasks'));
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const summary = tasks.reduce((acc, task) => {
        if (task.status === 'todo' || !task.status) acc.todo++;
        else if (task.status === 'doing') acc.doing++;
        else if (task.status === 'done' || task.completed) acc.done++;
        return acc;
      }, { todo: 0, doing: 0, done: 0 });
      
      setKanbanSummary(summary);
    } catch (error) {
      console.warn('Using mock Kanban data:', error);
      setKanbanSummary({ todo: 3, doing: 2, done: 5 });
    }
  };

  // Check if journal entry was submitted today
  const checkJournalStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const user = getUser();
      if (!user) return;
      
      const snapshot = await getDocs(
        query(
          collection(db, 'userJournal'),
          where('userId', '==', user.uid),
          where('date', '==', today)
        )
      );
      
      if (!snapshot.empty) {
        const journalData = snapshot.docs[0].data();
        setJournalEntry(prev => ({ ...prev, submitted: true }));
        setSubmittedJournalData(journalData);
      } else {
        setJournalEntry(prev => ({ ...prev, submitted: false }));
        setSubmittedJournalData(null);
      }
    } catch (error) {
      console.warn('Could not check journal status:', error);
    }
  };

  // Toggle schedule item completion
  const toggleScheduleCompletion = async (itemId, currentStatus) => {
    const task = todaysSchedule.find(t => t.id === itemId);
    if (!task) return;

    // Check if task can be completed (only today's tasks with time <= current time)
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const today = new Date().toISOString().split('T')[0];

    if (task.date === today && task.time > currentTime && !currentStatus) {
      alert('This task cannot be completed yet - it\'s scheduled for later today');
      return;
    }

    try {
      const itemRef = doc(db, 'schedules', itemId);
      await updateDoc(itemRef, {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date() : null
      });
      fetchTodaysSchedule();
    } catch (error) {
      console.error('Error updating schedule item:', error);
      // Update locally if Firebase fails
      setTodaysSchedule(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, completed: !currentStatus } : item
        )
      );
    }
  };

  // Submit journal entry with improved Firestore integration
  const submitJournalEntry = async () => {
    if (!selectedMood || !journalEntry.gratitude.trim() || !journalEntry.feeling.trim()) {
      alert('Please complete all fields: select your mood, describe how you felt, and add something you\'re grateful for.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const user = getUser();
      if (!user) return;
      
      // Check if entry already exists
      const existingSnapshot = await getDocs(
        query(
          collection(db, 'userJournal'),
          where('userId', '==', user.uid),
          where('date', '==', today)
        )
      );

      if (!existingSnapshot.empty) {
        alert('You have already submitted your journal entry for today! ✨');
        return;
      }

      const journalData = {
        userId: user.uid,
        username: username,
        date: today,
        mood: selectedMood,
        feeling: journalEntry.feeling,
        gratitude: journalEntry.gratitude,
        affirmation: dailyAffirmation,
        timestamp: new Date(),
        createdAt: new Date()
      };

      await addDoc(collection(db, 'userJournal'), journalData);
      
      setJournalEntry(prev => ({ ...prev, submitted: true }));
      setSubmittedJournalData(journalData);
      setSelectedMood('');
      
      // Show success message
      alert('✨ Your thoughts have been minted! Thank you for taking care of yourself today.');
    } catch (error) {
      console.error('Error submitting journal:', error);
      alert('Could not save your entry right now. Please try again later.');
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Get current time in HH:MM format for filtering past tasks
  const getCurrentTime = () => {
    return time.toTimeString().slice(0, 5);
  };

  // Check if task can be ticked off
  const canTickTask = (task) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    // Can tick if it's today and time has passed, or if it's already completed
    return task.completed || (task.date === today && task.time <= currentTime);
  };

  // Check if task is in the future
  const isFutureTask = (task) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    return task.date > today || (task.date === today && task.time > currentTime);
  };

  // Filter upcoming tasks (show all for today)
  const upcomingTasks = todaysSchedule;

  // Get next upcoming task
  const nextTask = upcomingTasks.find(item => !item.completed);

  // Breather Mode Component
  if (isBreatherMode) {
    return (
      <div className="breather-mode">
        <div className="breather-content">
          <div className="meditation-animation">
            <div className="breathing-circle"></div>
          </div>
          <h2>Take a moment to breathe</h2>
          <p>Inhale... hold... exhale... 🌿</p>
          <button 
            className="mint-button"
            onClick={() => setIsBreatherMode(false)}
          >
            Enough Mint 🍃
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="dashboard-wrapper">
      <Sidebar />

      <main className="dashboard-main">
        {/* User Greeting with Date/Time */}
        <div className="dashboard-header">
          <div className="greeting-section">
            <h2 className="greeting">Hi {username} 👋</h2>
            <p className="daily-affirmation">{dailyAffirmation}</p>
            {reinforcement && (
              <p className="subtext positive-reinforcement">{reinforcement}</p>
            )}
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
          <div className="time-display">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />
            {time.toDateString()}
          </div>
        </div>


        {/* Need a Mint Button - White style */}
        <div className="mint-action-section">
          <button 
            onClick={() => setIsBreatherMode(true)}
            className="white-mint-button"
          >
            🌿 Need a Mint? 🍃
          </button>
        </div>

        <div className="dashboard-grid">
          {/* KPIs and Schedule Side by Side */}
          <div className="kpi-schedule-container">
            {/* KPIs Section */}
            <div className="kpi-section">
              {/* Pomodoro Summary */}
              <div className="summary-card pomodoro-card">
                <div className="section-header">
                  <h3>🍅 FOCUS</h3>
                </div>
                <div className="summary-content">
                  <div className="session-count">
                    <span className="big-number">{pomodoroSessions}</span>
                    <span className="label">sessions today</span>
                  </div>
                  <Link to="/pomodoro" className="summary-action">
                    <button className="mint-button small">
                      Start Timer
                    </button>
                  </Link>
                </div>
              </div>

              {/* Kanban Task Summary */}
              <div className="summary-card kanban-card">
                <div className="section-header">
                  <h3>📋 TASKS</h3>
                </div>
                <div className="summary-content">
                  <div className="kanban-stats">
                    <div className="stat-item">
                      <span className="stat-number todo">{kanbanSummary.todo}</span>
                      <span className="stat-label">To-Do</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number doing">{kanbanSummary.doing}</span>
                      <span className="stat-label">Doing</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number done">{kanbanSummary.done}</span>
                      <span className="stat-label">Done</span>
                    </div>
                  </div>
                  <Link to="/kanban" className="summary-action">
                    <button className="mint-button small">
                      View Board
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Today's Schedule - Enhanced UI */}
            <div className="schedule-card enhanced">
              <div className="section-header">
                <div className="header-content">
                  <h3>📅 TODAY'S SCHEDULE</h3>
                  <span className="task-count">{upcomingTasks.length} {upcomingTasks.length === 1 ? 'task' : 'tasks'}</span>
                </div>
                <button 
                  onClick={() => setShowAddSchedule(true)}
                  className="add-task-btn modern"
                >
                  <span className="add-icon">+</span>
                  <span>Add Task</span>
                </button>
              </div>
              
              {/* Add Task Form */}
              {showAddSchedule && (
                <div className="add-task-form">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({...prev, title: e.target.value}))}
                    className="task-input"
                  />
                  <div className="task-time-date">
                    <input
                      type="time"
                      value={newTask.time}
                      onChange={(e) => setNewTask(prev => ({...prev, time: e.target.value}))}
                      className="task-time-input"
                      placeholder="Set time"
                    />
                  </div>
                  <div className="task-form-actions">
                    <button onClick={addScheduleTask} className="save-task-btn">Save</button>
                    <button onClick={() => setShowAddSchedule(false)} className="cancel-task-btn">Cancel</button>
                  </div>
                </div>
              )}
              
              <div className="schedule-list">
                {upcomingTasks.length === 0 ? (
                  <div className="empty-state">
                    No scheduled items for today. Time to plan! ✨
                  </div>
                ) : (
                  upcomingTasks.map((item) => (
                    <div 
                      key={item.id} 
                      className={`schedule-item ${item.completed ? 'completed' : ''} ${!canTickTask(item) ? 'future-task' : ''}`}
                    >
                      <div className="schedule-content">
                        <input
                          type="checkbox"
                          checked={item.completed || false}
                          onChange={() => toggleScheduleCompletion(item.id, item.completed)}
                          disabled={!canTickTask(item)}
                          className="schedule-checkbox"
                        />
                        <div className="schedule-details">
                          {editingTask === item.id ? (
                            <div className="edit-task-form">
                              <input
                                type="text"
                                value={item.task}
                                onChange={(e) => {
                                  const updatedTasks = todaysSchedule.map(t => 
                                    t.id === item.id ? {...t, task: e.target.value} : t
                                  );
                                  setTodaysSchedule(updatedTasks);
                                }}
                                className="edit-task-input"
                              />
                              <input
                                type="time"
                                value={item.time}
                                onChange={(e) => {
                                  const updatedTasks = todaysSchedule.map(t => 
                                    t.id === item.id ? {...t, time: e.target.value} : t
                                  );
                                  setTodaysSchedule(updatedTasks);
                                }}
                                className="edit-time-input"
                              />
                              <div className="edit-actions">
                                <button 
                                  onClick={() => editScheduleTask(item.id, {task: item.task, time: item.time})}
                                  className="save-edit-btn"
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => setEditingTask(null)}
                                  className="cancel-edit-btn"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="schedule-time">{formatTime12Hour(item.time)}</span>
                              <span className="schedule-task">{item.task}</span>
                              {(isFutureTask(item) || !item.completed) && (
                                <button 
                                  onClick={() => setEditingTask(item.id)}
                                  className="edit-task-btn"
                                >
                                  ✏️
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mint It - Daily Reflection Section */}
          {!journalEntry.submitted && (
            <section className="mint-it-section">
              <h2 className="mint-it-title">🌿 Mint It – Daily Reflection</h2>
              
              <div className="mint-it-container">
                {/* Sticky Note 1: Today I felt */}
                <div className="sticky-note-wrapper">
                  <div className="sticky-note feelings">
                    <h4 className="sticky-note-title">Today I felt...</h4>
                    <textarea
                      placeholder="happy, overwhelmed, grateful, tired..."
                      value={journalEntry.feeling}
                      onChange={(e) => setJournalEntry(prev => ({...prev, feeling: e.target.value}))}
                      className="sticky-textarea"
                      rows="4"
                    />
                  </div>
                </div>

                {/* Sticky Note 2: Grateful for */}
                <div className="sticky-note-wrapper">
                  <div className="sticky-note gratitude">
                    <h4 className="sticky-note-title">One thing I'm grateful for...</h4>
                    <textarea
                      placeholder="my morning coffee, a friend's text, completing a task..."
                      value={journalEntry.gratitude}
                      onChange={(e) => setJournalEntry(prev => ({...prev, gratitude: e.target.value}))}
                      className="sticky-textarea"
                      rows="4"
                    />
                  </div>
                </div>

                {/* Affirmation of the Day */}
                <div className="affirmation-wrapper">
                  <h4 className="affirmation-title">Affirmation of the Day</h4>
                  <div className="affirmation-text">
                    {dailyAffirmation}
                  </div>
                </div>
              </div>

              {/* Mood Tracker */}
              <div className="mood-tracker-section">
                <label className="mood-label">How are you feeling today?</label>
                <div className="mood-tracker">
                  {[
                    { emoji: '😊', label: 'Great' },
                    { emoji: '🙂', label: 'Good' },
                    { emoji: '😐', label: 'Okay' },
                    { emoji: '😔', label: 'Down' },
                    { emoji: '😰', label: 'Stressed' }
                  ].map((mood) => (
                    <button
                      key={mood.label}
                      type="button"
                      className={`mood-button ${selectedMood === mood.label ? 'selected' : ''}`}
                      onClick={() => setSelectedMood(mood.label)}
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <span className="mood-label">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if (!selectedMood || !journalEntry.gratitude.trim() || !journalEntry.feeling.trim()) {
                    alert('Please complete all fields: select your mood, describe how you felt, and add something you\'re grateful for.');
                    return;
                  }
                  submitJournalEntry();
                }}
                className="mint-it-btn"
              >
                Mint it ✨
              </button>
            </section>
          )}

          {/* Show submitted journal data in sticky notes */}
          {journalEntry.submitted && submittedJournalData && (
            <section className="mint-it-section completed">
              <h2 className="mint-it-title">🌿 Mint It – Daily Reflection</h2>
              
              <div className="mint-it-container">
                {/* Sticky Note 1: Today I felt - with data */}
                <div className="sticky-note-wrapper">
                  <div className="sticky-note feelings completed">
                    <h4 className="sticky-note-title">Today I felt...</h4>
                    <div className="sticky-content-text">
                      {submittedJournalData.feeling}
                    </div>
                    <div className="mood-display">
                      {submittedJournalData.mood && (
                        <span className="mood-badge">
                          {submittedJournalData.mood === 'Great' && '😊'}
                          {submittedJournalData.mood === 'Good' && '🙂'}
                          {submittedJournalData.mood === 'Okay' && '😐'}
                          {submittedJournalData.mood === 'Down' && '😔'}
                          {submittedJournalData.mood === 'Stressed' && '😰'}
                          {submittedJournalData.mood}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Note 2: Grateful for - with data */}
                <div className="sticky-note-wrapper">
                  <div className="sticky-note gratitude completed">
                    <h4 className="sticky-note-title">One thing I'm grateful for...</h4>
                    <div className="sticky-content-text">
                      {submittedJournalData.gratitude}
                    </div>
                  </div>
                </div>

                {/* Affirmation of the Day - with data */}
                <div className="affirmation-wrapper">
                  <h4 className="affirmation-title">Affirmation of the Day</h4>
                  <div className="affirmation-text completed">
                    {submittedJournalData.affirmation}
                  </div>
                </div>
              </div>

              <div className="completion-status">
                <span className="completion-icon">✨</span>
                <span className="completion-text">Your thoughts have been minted!</span>
                <button 
                  onClick={() => {
                    setJournalEntry({
                      feeling: submittedJournalData.feeling,
                      gratitude: submittedJournalData.gratitude,
                      submitted: false
                    });
                    setSelectedMood(submittedJournalData.mood);
                    setSubmittedJournalData(null);
                  }}
                  className="edit-journal-btn"
                >
                  ✏️ Edit
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
