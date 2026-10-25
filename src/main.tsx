import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initBrowserMockApi } from './utils/browserMockApi.ts';

// Initialize client-side API mock when hosted on GitHub Pages or static environment
initBrowserMockApi();

createRoot(document.getElementById('root')!).render(<App />);

