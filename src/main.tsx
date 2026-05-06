import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import DataHydrator from './components/DataHydrator.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataHydrator>
      <App />
    </DataHydrator>
  </StrictMode>,
);
