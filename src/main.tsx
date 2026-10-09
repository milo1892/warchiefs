import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './app/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing.');
createRoot(root).render(<StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>);
