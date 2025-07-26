// File: src/pages/Kanban.jsx

import { useEffect, useState } from 'react';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import './assets/kanban.css';

export default function Kanban() {
  const name = localStorage.getItem('username') || 'Ankur';
  const [tasks, setTasks] = useState({ todo: [], doing: [], done: [] });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const snapshot = await getDocs(collection(db, 'tasks'));
    const allTasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const grouped = { todo: [], doing: [], done: [] };
    allTasks.forEach(task => {
      grouped[task.status].push(task);
    });
    setTasks(grouped);
  };

  const addTask = async () => {
    const title = prompt('Enter new task:');
    if (title) {
      await addDoc(collection(db, 'tasks'), {
        title,
        status: 'todo'
      });
      fetchTasks();
    }
  };

  const editTask = async (task) => {
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle) {
      await updateDoc(doc(db, 'tasks', task.id), { title: newTitle });
      fetchTasks();
    }
  };

  const deleteTask = async (task) => {
    if (window.confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'tasks', task.id));
      fetchTasks();
    }
  };

  return (
    <div className="kanban-container">
      <div className="sidebar">
        <h2>Hey {name}!</h2>
        <ul>
          <li>🏠 Dashboard</li>
          <li className="active">📅 To do</li>
          <li>⏱ Pomodoro</li>
          <li>⚙️ Settings</li>
        </ul>
      </div>

      <main className="kanban-main">
        <div className="kanban-header">
          <h3>DATE</h3>
          <button onClick={addTask}>+ Add Task</button>
        </div>

        <div className="kanban-board">
          {['todo', 'doing', 'done'].map((status) => (
            <div className={`kanban-column ${status}`} key={status}>
              <h3>{status.toUpperCase()}</h3>
              {tasks[status].map((task) => (
                <div className="kanban-card" key={task.id}>
                  {task.title}
                  <div className="kanban-actions">
                    <button onClick={() => editTask(task)}>✏️</button>
                    <button onClick={() => deleteTask(task)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
