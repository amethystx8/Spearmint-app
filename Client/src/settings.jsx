import './assets/settings.css';

export default function Settings() {
  return (
    <div className="settings-container">
      <div className="sidebar">
        <ul>
          <li>🏠 Dashboard</li>
          <li>📅 To do</li>
          <li>⏱ Pomodoro</li>
          <li className="active">⚙️ Settings</li>
        </ul>
      </div>

      <div className="main-content">
        <h1>SETTINGS</h1>
        <div className="setting-option">ACCOUNT</div>
        <div className="setting-option">APPEARANCE</div>
        <div className="setting-option">TOOLS</div>
      </div>
    </div>
  );
}
