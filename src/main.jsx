import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Poppins, English letters only (the other alphabets and the light 300
// weight were never used).
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';

import App from './App';
import './styles/theme.css';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
