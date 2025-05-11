import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletContextProvider } from './components/walletconnect.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </React.StrictMode>
);
