import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// Register minimal service worker (no caching)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // In Vite dev server, SW is ignored; in production it will register
        navigator.serviceWorker.register('/service-worker.js').catch((err) => {
            console.error('Service worker registration failed:', err);
        });
    });
}

