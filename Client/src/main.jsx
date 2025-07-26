import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './index.css';
import App from './App.jsx';
import Home from './home.jsx';
import Dashboard from './dashboard.jsx';
import Kanban from './kanban.jsx';
import Pomodoro from './pomodoro.jsx';
import Settings from './settings.jsx';
import Signup from './signup.jsx';
import Login from './login.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
