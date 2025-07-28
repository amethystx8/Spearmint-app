import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './assets/settings.css';
import Sidebar from './components/Sidebar';

export default function Settings() {
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    if (!localStorage.getItem('username')) {
      navigate('/login');
      return;
    }
  }, [navigate]);
  return (
    <div className="settings-container">
      <Sidebar />

      <div className="main-content">
        <h1>SETTINGS</h1>
        <div className="setting-option">ACCOUNT</div>
        <div className="setting-option">APPEARANCE</div>
        <div className="setting-option">TOOLS</div>
      </div>
    </div>
  );
}
