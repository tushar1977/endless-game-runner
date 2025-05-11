import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const DevnetFaucet = () => {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(1); // Default 1 SOL

  const connection = new Connection('https://api.devnet.solana.com');

  const requestAirdrop = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const lamports = amount * LAMPORTS_PER_SOL;
      const signature = await connection.requestAirdrop(publicKey, lamports);

      await connection.confirmTransaction(signature, 'confirmed');
      setSuccess(true);
    } catch (err) {
      console.error('Airdrop failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#f5f5f5',
      maxWidth: '400px',
      margin: '20px auto',
      textAlign: 'center'
    }}>
      <h3>Devnet SOL Faucet</h3>

      {!publicKey ? (
        <div style={{ margin: '15px 0' }}>
          <WalletMultiButton />
        </div>
      ) : (
        <>
          <div style={{ margin: '15px 0' }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '5px' }}>
              Amount (SOL):
            </label>
            <input
              id="amount"
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                width: '100%',
                maxWidth: '200px'
              }}
            />
          </div>

          <button
            onClick={requestAirdrop}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Processing...' : 'Request SOL'}
          </button>

          {success && (
            <p style={{ color: 'green', marginTop: '10px' }}>
              Success! {amount} SOL has been sent to your wallet.
            </p>
          )}

          {error && (
            <p style={{ color: 'red', marginTop: '10px' }}>
              Error: {error}
            </p>
          )}

          <p style={{ fontSize: '12px', marginTop: '15px', color: '#666' }}>
            Note: Devnet SOL has no real value. You can request up to 5 SOL at a time.
          </p>
        </>
      )}
    </div>
  );
};

export default DevnetFaucet;
