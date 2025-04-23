import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🟡 Solana Wallet Connect Demo</h1>
      <WalletMultiButton />
    </div>
  );
}

export default App;
