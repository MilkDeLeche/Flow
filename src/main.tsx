import React from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import App from './App';
import './index.css';
import 'katex/dist/katex.min.css';

// Register GSAP plugins once for the whole app.
gsap.registerPlugin(useGSAP, ScrollTrigger);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
