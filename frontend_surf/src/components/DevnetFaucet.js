import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Loader2 } from 'lucide-react';
import { WalletConnectButton } from './WalletConnectButton';

const DevnetFaucet = () => {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(1); // Default 1 SOL

  const connection = new Connection('https://api.devnet.solana.com');

  const requestAirdrop = async () => {
    if (!publicKey) {
      setError('Please connect your wallet to request Devnet SOL.');
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
      setError(err.message || 'Failed to request airdrop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    React.createElement("div", { style: { minHeight: '100vh', backgroundImage: 'linear-gradient(to bottom right, #4338CA, #6D28D9, #1E293B)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      React.createElement("div", { style: { width: '100%', maxWidth: '28rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.5rem', } },
        React.createElement("h1", { style: { fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', backgroundClip: 'text', color: 'transparent', backgroundImage: 'linear-gradient(to right, #60A5FA, #8B5CF6)' } },
          "Devnet SOL Faucet"
        ),
        React.createElement("div", { style: { display: 'flex', justifyContent: 'center' } },
          React.createElement(WalletConnectButton, {
            style: {
              backgroundImage: 'linear-gradient(to right, #8B5CF6, #3B82F6)',
              '&:hover': {
                backgroundImage: 'linear-gradient(to right, #9333EA, #2563EB)',
              },
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '1rem',
              fontWeight: '600',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }
          },
            "Connect Wallet"
          )
        ),
        publicKey && (
          React.createElement("div", { style: { marginTop: '1.5rem' } },
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "amount", style: { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#D1D5DB', marginBottom: '0.5rem' } },
                "Amount (SOL)"
              ),
              React.createElement("input", {
                id: "amount",
                type: "number",
                min: "0.1",
                max: "5",
                step: "0.1",
                value: amount,
                onChange: (e) => setAmount(parseFloat(e.target.value) || 0),
                style: {
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  color: '#fff',
                  border: '1px solid #374151',
                  outline: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                  '::placeholder': {
                    color: '#9CA3AF'
                  },
                  '&:focus': {
                    ringWidth: '2px',
                    ringColor: '#8B5CF6',
                    borderColor: '#8B5CF6',
                  }
                },
                placeholder: "Enter SOL amount (0.1 - 5)"
              }),
              React.createElement("p", { style: { marginTop: '0.25rem', fontSize: '0.75rem', color: '#6B7280' } }, "Max 5 SOL per request")
            ),
            React.createElement("button", {
              onClick: requestAirdrop,
              disabled: loading,
              style: {
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontWeight: '600',
                color: '#fff',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                fontSize: '1rem',
                border: 'none',
                marginTop: '1.5rem',
                backgroundColor: loading ? '#9F60FF' : '#8B5CF6',
                backgroundImage: !loading ? 'linear-gradient(to right, #8B5CF6, #3B82F6)' : 'none',
                '&:hover': !loading ? {
                  backgroundImage: 'linear-gradient(to right, #9333EA, #2563EB)',
                } : {},
                opacity: loading ? 0.5 : 1,
                boxShadow: !loading ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' : 'none'
              }
            },
              loading ? (
                <>
                  <Loader2 style={{ animation: 'spin 1.5s linear infinite', marginRight: '0.5rem', height: '1.25rem', width: '1.25rem' }} />
                  Processing...
                </>
              ) : (
                'Request Airdrop'
              )
            ),
            success && (
              React.createElement("div", { style: { padding: '1rem', backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', borderRadius: '0.5rem', border: '1px solid rgba(22, 163, 74, 0.2)' } },
                React.createElement("p", { style: { fontWeight: '500' } }, "Success!"),
                React.createElement("p", null, amount, " SOL has been sent to your wallet.")
              )
            ),
            error && (
              React.createElement("div", { style: { padding: '1rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', borderRadius: '0.5rem', border: '1px solid rgba(220, 38, 38, 0.2)' } },
                React.createElement("p", { style: { fontWeight: '500' } }, "Error"),
                React.createElement("p", null, error)
              )
            ),
            publicKey && (
              React.createElement("div", { style: { fontSize: '0.75rem', color: '#6B7280', textAlign: 'center', marginTop: '1rem' } },
                React.createElement("p", null, "Devnet SOL has no real value. For testing purposes only."),
                React.createElement("p", null,
                  "Your wallet: ", publicKey.toString().slice(0, 6), "...",
                  publicKey.toString().slice(-4)
                )
              )
            )
          )
        )
      )
    )
  );
};

export default DevnetFaucet;
