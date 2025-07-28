import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './assets/dashboard.css';
import { db } from './firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Sidebar from './components/Sidebar';

export default function Journal() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Friend';
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    if (!localStorage.getItem('username')) {
      navigate('/login');
      return;
    }
    fetchJournalEntries();
  }, [navigate]);

  const fetchJournalEntries = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user')) || { uid: 'anonymous' };
      
      const snapshot = await getDocs(
        query(
          collection(db, 'userJournal'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        )
      );
      
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJournalEntries(entries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      // Use mock data for demo
      setJournalEntries([
        {
          id: '1',
          date: '2025-07-28',
          mood: 'Great',
          feeling: 'productive and energized',
          gratitude: 'my morning coffee and a productive work session',
          affirmation: 'You are capable of amazing things! ✨'
        },
        {
          id: '2',
          date: '2025-07-27',
          mood: 'Good',
          feeling: 'calm and focused',
          gratitude: 'spending time with family',
          affirmation: 'Every small step counts toward your goals 🌱'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getMoodEmoji = (mood) => {
    const moodMap = {
      'Great': '😊',
      'Good': '🙂',
      'Okay': '😐',
      'Down': '😔',
      'Stressed': '😰'
    };
    return moodMap[mood] || '😊';
  };

  const getStickyColor = (index) => {
    const colors = ['#FEF3C7', '#DBEAFE', '#F3E8FF', '#D1FAE5', '#FED7D7'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar />
        <main className="dashboard-main">
          <div className="loading">Loading your journal entries...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="greeting-section">
            <h2 className="greeting">📖 Your Journal</h2>
            <p className="subtext">Your personal collection of daily reflections</p>
          </div>
        </div>

        <div className="journal-grid">
          {journalEntries.length === 0 ? (
            <div className="empty-journal">
              <h3>No journal entries yet</h3>
              <p>Start your journey by completing your daily check-in on the dashboard! 🌿</p>
            </div>
          ) : (
            journalEntries.map((entry, index) => (
              <div key={entry.id} className="journal-sticky-note" style={{transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 3 + 1)}deg)`}}>
                <div 
                  className="sticky-note journal-entry"
                  style={{ backgroundColor: getStickyColor(index) }}
                >
                  <div className="journal-date">
                    {formatDate(entry.date)}
                  </div>
                  
                  <div className="journal-mood">
                    <span className="mood-emoji-large">{getMoodEmoji(entry.mood)}</span>
                    <span className="mood-text">Feeling {entry.mood}</span>
                  </div>

                  <div className="journal-section">
                    <h4>Today I felt...</h4>
                    <p>{entry.feeling}</p>
                  </div>

                  <div className="journal-section">
                    <h4>Grateful for...</h4>
                    <p>{entry.gratitude}</p>
                  </div>

                  <div className="journal-affirmation">
                    <em>"{entry.affirmation}"</em>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
