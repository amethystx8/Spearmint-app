import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import './assets/kanban.css';
import Sidebar from './components/Sidebar';

// Task Card Component
function TaskCard({ task, isDragging }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today && task.status !== 'completed';
  };

  return (
    <div 
      className={`task-card ${isDragging ? 'dragging' : ''} ${isOverdue(task.dueDate) ? 'overdue' : ''}`}
    >
      <div className="task-header">
        <h4 className="task-title">{task.taskTitle}</h4>
        <div 
          className="priority-badge"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        >
          {task.priority}
        </div>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      
      <div className="task-dates">
        <div className="date-item">
          <span className="date-label">Start:</span>
          <span className="date-value">{formatDate(task.startDate)}</span>
        </div>
        {task.dueDate && (
          <div className={`date-item ${isOverdue(task.dueDate) ? 'overdue-date' : ''}`}>
            <span className="date-label">Due:</span>
            <span className="date-value">{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable Task Card Component
function SortableTaskCard({ task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const handleClick = () => {
    console.log('🖱️ Task card clicked:', task.taskTitle);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'dragging' : ''}
      onClick={handleClick}
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'drag-over' : ''}`}
    >
      {children}
    </div>
  );
}

export default function Kanban() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState({
    'to-do': [],
    'in-progress': [],
    'completed': []
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    taskTitle: '',
    description: '',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  });
  const [activeId, setActiveId] = useState(null);
  const [user, setUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get user from localStorage
  useEffect(() => {
    console.log('Checking user authentication...');
    const userData = localStorage.getItem('user');
    const username = localStorage.getItem('username');
    console.log('Raw user data from localStorage:', userData);
    console.log('Username from localStorage:', username);
    
    if (!userData && !username) {
      console.log('No user data found, redirecting to login');
      navigate('/login');
      return;
    }
    
    try {
      let parsedUser;
      if (userData) {
        parsedUser = JSON.parse(userData);
        console.log('Parsed user:', parsedUser);
        
        // If user data doesn't have uid, use username as uid
        if (!parsedUser.uid && parsedUser.username) {
          parsedUser.uid = parsedUser.username;
        } else if (!parsedUser.uid && username) {
          parsedUser.uid = username;
        }
      } else if (username) {
        // Create user object from username
        parsedUser = {
          uid: username,
          username: username
        };
      }
      
      console.log('Final user object:', parsedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Fallback to username if JSON parsing fails
      if (username) {
        setUser({
          uid: username,
          username: username
        });
      } else {
        navigate('/login');
      }
    }
  }, [navigate]);

  // Real-time Firestore listener
  useEffect(() => {
    if (!user?.uid) return;

    console.log('Setting up Firestore listener for user:', user.uid);

    const q = query(
      collection(db, 'kanbanTasks'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Firestore snapshot received, docs:', snapshot.docs.length);
        setConnectionStatus('connected');
        const allTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Group tasks by status and sort them
        const grouped = {
          'to-do': [],
          'in-progress': [],
          'completed': []
        };

        allTasks.forEach(task => {
          if (grouped[task.status]) {
            grouped[task.status].push(task);
          }
        });

        // Sort tasks within each column
        Object.keys(grouped).forEach(status => {
          grouped[status].sort((a, b) => {
            // First by priority (high -> medium -> low)
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by start date
            return new Date(a.startDate) - new Date(b.startDate);
          });
        });

        console.log('Grouped tasks:', grouped);
        setTasks(grouped);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setConnectionStatus('error');
        // Fallback: try to show a message to the user
        if (error.code === 'permission-denied') {
          console.error('Permission denied - check Firestore rules');
        } else if (error.code === 'unavailable') {
          console.error('Firestore unavailable - check network connection');
        }
      }
    );

    return () => {
      console.log('Cleaning up Firestore listener');
      unsubscribe();
    };
  }, [user]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    console.log('HandleAddTask called');
    console.log('User:', user);
    console.log('New task:', newTask);
    
    if (!user?.uid) {
      console.error('No user UID found');
      return;
    }
    
    if (!newTask.taskTitle.trim()) {
      console.error('Task title is empty');
      return;
    }

    try {
      console.log('Attempting to add task to Firestore...');
      const taskData = {
        uid: user.uid,
        taskTitle: newTask.taskTitle.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        startDate: newTask.startDate,
        dueDate: newTask.dueDate || null,
        status: 'to-do',
        createdAt: serverTimestamp()
      };
      
      console.log('Task data to save:', taskData);
      const docRef = await addDoc(collection(db, 'kanbanTasks'), taskData);
      
      console.log('Task created successfully with ID:', docRef.id);

      // Reset form
      setNewTask({
        taskTitle: '',
        description: '',
        priority: 'medium',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: ''
      });
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error adding task:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Show user-friendly error message
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check if you are logged in correctly.');
      } else if (error.code === 'unavailable') {
        alert('Unable to connect to the database. Please check your internet connection.');
      } else {
        alert('Error creating task. Please try again.');
      }
    }
  };

  const handleDragStart = (event) => {
    console.log('🚀 DRAG START:', event.active.id);
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    console.log('🔄 DRAG OVER - Active:', active?.id, 'Over:', over?.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    console.log('🏁 DRAG END - Active:', active?.id, 'Over:', over?.id);
    console.log('🔍 Available drop zones:', {
      'to-do': 'to-do',
      'in-progress': 'in-progress',
      'completed': 'completed'
    });
    
    if (!over) {
      console.log('❌ No drop target found');
      setActiveId(null);
      return;
    }

    const activeTask = findTaskById(active.id);
    if (!activeTask) {
      console.log('❌ Active task not found');
      setActiveId(null);
      return;
    }

    console.log('📋 Active task:', activeTask.taskTitle, 'Status:', activeTask.status);

    // Determine the new status based on the drop zone
    let newStatus = activeTask.status;
    
    console.log('🎯 Checking drop zone:', over.id);
    
    // Check if dropped directly on a column
    if (over.id === 'to-do') {
      newStatus = 'to-do';
      console.log('✅ Dropped on to-do column');
    } else if (over.id === 'in-progress') {
      newStatus = 'in-progress';
      console.log('✅ Dropped on in-progress column');
    } else if (over.id === 'completed') {
      newStatus = 'completed';
      console.log('✅ Dropped on completed column');
    }
    // If dropped on another task, find which column it belongs to
    else {
      const overTask = findTaskById(over.id);
      if (overTask) {
        newStatus = overTask.status;
        console.log('✅ Dropped on task, new status:', newStatus);
      } else {
        console.log('❓ Unknown drop zone:', over.id);
      }
    }

    console.log('🎯 Target status:', newStatus, '(Current:', activeTask.status, ')');

    // Update task status if changed
    if (newStatus !== activeTask.status) {
      console.log('🔄 Updating task status from', activeTask.status, 'to', newStatus);
      try {
        await updateDoc(doc(db, 'kanbanTasks', active.id), {
          status: newStatus,
          updatedAt: new Date()
        });
        console.log('✅ Task status updated successfully');
      } catch (error) {
        console.error('❌ Error updating task status:', error);
      }
    } else {
      console.log('ℹ️ No status change needed');
    }

    setActiveId(null);
  };

  const findTaskById = (id) => {
    for (const status of Object.keys(tasks)) {
      const task = tasks[status].find(task => task.id === id);
      if (task) return task;
    }
    return null;
  };

  const getTaskCountText = (count, status) => {
    if (count === 0) return 'No tasks';
    if (count === 1) return '1 task';
    return `${count} tasks`;
  };

  if (!user) {
    return (
      <div className="kanban-container">
        <Sidebar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      <Sidebar />
      
      <main className="kanban-main">
        <div className="kanban-header">
          <div className="header-content">
            <h1>To-Do Board</h1>
            <p className="header-subtitle">Organize your tasks and track progress</p>
          </div>
          <div className="header-right">
            <div className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connecting' && '🔄 Connecting...'}
              {connectionStatus === 'connected' && '✅ Connected'}
              {connectionStatus === 'error' && '❌ Connection Error'}
            </div>
            <div className="header-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {/* To-Do Column */}
            <DroppableColumn id="to-do" className="kanban-column to-do">
              <div className="column-header">
                <div className="column-title">
                  <h3>To-Do</h3>
                  <span className="task-count">
                    {getTaskCountText(tasks['to-do'].length)}
                  </span>
                </div>
                <button 
                  className="add-task-btn"
                  onClick={() => {
                    console.log('Add Task button clicked');
                    setShowTaskModal(true);
                  }}
                >
                  + Add Task
                </button>
              </div>

              {/* Task Modal */}
              {showTaskModal && (
                <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
                  <div className="task-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Create New Task</h3>
                      <button 
                        className="close-modal-btn"
                        onClick={() => setShowTaskModal(false)}
                      >
                        ×
                      </button>
                    </div>

                    <form className="task-form" onSubmit={handleAddTask}>
                      <div className="form-field">
                        <label>Task Title *</label>
                        <input
                          type="text"
                          value={newTask.taskTitle}
                          onChange={(e) => setNewTask({...newTask, taskTitle: e.target.value})}
                          placeholder="Enter task title"
                          required
                        />
                      </div>

                      <div className="form-field">
                        <label>Description</label>
                        <textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                          placeholder="Optional task description"
                          rows="3"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>Priority *</label>
                          <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                            required
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>

                        <div className="form-field">
                          <label>Start Date *</label>
                          <input
                            type="date"
                            value={newTask.startDate}
                            onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>Due Date</label>
                        <input
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                          min={newTask.startDate}
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="submit-btn">
                          Create Task
                        </button>
                        <button 
                          type="button" 
                          className="cancel-btn"
                          onClick={() => setShowTaskModal(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="tasks-container">
                <SortableContext 
                  items={tasks['to-do'].map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {tasks['to-do'].map(task => (
                    <SortableTaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
                {tasks['to-do'].length === 0 && (
                  <div className="empty-state">
                    <p>No tasks yet. Add your first task to get started!</p>
                  </div>
                )}
              </div>
            </DroppableColumn>

            {/* In Progress Column */}
            <DroppableColumn id="in-progress" className="kanban-column in-progress">
              <div className="column-header">
                <div className="column-title">
                  <h3>In Progress</h3>
                  <span className="task-count">
                    {getTaskCountText(tasks['in-progress'].length)}
                  </span>
                </div>
              </div>

              <div className="tasks-container">
                <SortableContext 
                  items={tasks['in-progress'].map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {tasks['in-progress'].map(task => (
                    <SortableTaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
                {tasks['in-progress'].length === 0 && (
                  <div className="empty-state">
                    <p>Drag tasks here when you start working on them</p>
                  </div>
                )}
              </div>
            </DroppableColumn>

            {/* Completed Column */}
            <DroppableColumn id="completed" className="kanban-column completed">
              <div className="column-header">
                <div className="column-title">
                  <h3>Completed</h3>
                  <span className="task-count">
                    {getTaskCountText(tasks['completed'].length)}
                  </span>
                </div>
              </div>

              <div className="tasks-container">
                <SortableContext 
                  items={tasks['completed'].map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {tasks['completed'].map(task => (
                    <SortableTaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
                {tasks['completed'].length === 0 && (
                  <div className="empty-state">
                    <p>Completed tasks will appear here</p>
                  </div>
                )}
              </div>
            </DroppableColumn>
          </div>

          <DragOverlay>
            {activeId ? (
              <TaskCard task={findTaskById(activeId)} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
