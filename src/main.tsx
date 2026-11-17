import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('RecoverX root element is missing.');
}

const app = (
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`)
    .catch((error: unknown) => console.error('Offline support could not be enabled:', error));
}
