// src/components/Notifications.jsx
import React from "react";

const Notifications = ({ error, success }) => {
  if (!error && !success) return null;

  return (
    <div className="notifications-container">
      {error && (
        <div className="alert alert-error">
          <svg
            className="alert-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div className="alert-title">Error</div>
          <div className="alert-description">{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg
            className="alert-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="alert-title">Success</div>
          <div className="alert-description">{success}</div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
