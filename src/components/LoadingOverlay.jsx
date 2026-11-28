import React from 'react';
import './LoadingOverlay.css';

/** A shared, accessible busy indicator. Visible only while active. */
export default function LoadingOverlay({ active, title = 'Loading...', description = 'Please wait while we prepare everything.' }) {
  if (!active) return null;
  return (
    <div className="medlearn-loading-overlay" role="status" aria-live="polite" aria-label={title}>
      <div className="medlearn-loading-panel">
        <div className="medlearn-loading-spinner" aria-hidden="true" />
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
