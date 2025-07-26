
// // import reactLogo from './assets/react.svg'
// // import viteLogo from '/vite.svg'
// // import './App.css'
// import { useState, useEffect } from 'react';
// import { db } from './firebase';
// import { collection, addDoc, getDocs } from 'firebase/firestore';


// function App() {
//   const [task, setTask] = useState('');
//   const [tasks, setTasks] = useState([]);

//   const addTask = async () => {
//     if (!task.trim()) return;
//     await addDoc(collection(db, 'tasks'), {
//       title: task,
//       createdAt: new Date(),
//     });
//     setTask('');
//     fetchTasks();
//   };

//   const fetchTasks = async () => {
//     const snapshot = await getDocs(collection(db, 'tasks'));
//     const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     setTasks(data);
//   };

//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Spearmint Tasks</h1>

//       <input
//         type="text"
//         value={task}
//         onChange={(e) => setTask(e.target.value)}
//         placeholder="Add a task"
//       />
//       <button onClick={addTask}>Add</button>

//       <ul>
//         {tasks.map(t => (
//           <li key={t.id}>{t.title}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default App;

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);

  const addTask = async () => {
    if (!task.trim()) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: task,
        createdAt: serverTimestamp(),
      });
      setTask('');
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'tasks'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

return (
    <div style={{ padding: 20 }}>
      <h1>Spearmint Tasks</h1>

      <input
        type="text"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="Add a task"
      />
      <button onClick={addTask}>Add</button>

      <ul>
        {tasks.map(t => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
    </div>
  );
}
export default App;