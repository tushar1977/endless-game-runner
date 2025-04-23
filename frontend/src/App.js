import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
// Import Buffer from buffer package for browser compatibility
import { Buffer } from 'buffer';

const RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('Ahyi5zC8KucSuDKY1BxRp9v1x61jEsuamTcR9cky8NYm');

// Load the IDL - in a real app, you might want to fetch this from a server or import from a file
const IDL = require('./idl/surf.json'); // You'll need to have this file available

function App() {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (connected && publicKey) {
      console.log('✅ Wallet connected:', publicKey.toBase58());
      fetchProfile(); // Automatically fetch profile when wallet connects
    }
  }, [connected, publicKey]);

  const fetchProfile = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/player/fetchProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicKey: publicKey.toBase58() }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('🎯 Profile fetched:', data);
        setProfile(data);
      } else {
        console.warn('⚠️ Profile not found:', data);
        setProfile(null);

        // Ask user if they want to initialize a profile
        if (window.confirm('Player profile not found. Would you like to create one?')) {
          await initPlayer();
        }
      }
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError('Failed to fetch profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initPlayer = async () => {
    if (!publicKey || !signTransaction) {
      alert('Wallet not connected or doesn\'t support signing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create connection to Solana
      const connection = new Connection(RPC_URL, 'confirmed');

      // Set up Anchor provider with compatible wallet adapter
      // Create a wallet adapter that matches what Anchor expects
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs) => {
          return Promise.all(txs.map(tx => signTransaction(tx)));
        }
      };

      const provider = new anchor.AnchorProvider(
        connection,
        walletAdapter,
        { commitment: 'confirmed' }
      );

      const program = new anchor.Program(IDL, PROGRAM_ID, provider);

      // Calculate PDAs using TextEncoder
      const playerSeed = new TextEncoder().encode('player');
      const walletSeed = new TextEncoder().encode('wallet');

      const [playerPDA] = PublicKey.findProgramAddressSync(
        [playerSeed, publicKey.toBytes()],
        PROGRAM_ID
      );

      const [walletPDA] = PublicKey.findProgramAddressSync(
        [walletSeed, publicKey.toBytes()],
        PROGRAM_ID
      );

      console.log('🔄 Creating initialization transaction...');

      // Build the instruction using Anchor
      const tx = await program.methods.initPlayer()
        .accounts({
          playerAccount: playerPDA,
          signer: publicKey,
          wallet: walletPDA,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      // Get recent blockhash and set fee payer
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;

      console.log('🔑 Signing transaction...');
      // Sign the transaction
      const signedTx = await signTransaction(tx);

      // Serialize transaction to base64 string
      const serializedTx = Buffer.from(signedTx.serialize()).toString('base64');

      console.log('📡 Sending transaction to backend...');
      // Send the signed transaction to the backend
      const res = await fetch('http://localhost:4000/api/player/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedTx: serializedTx
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('✅ Player initialized!', data);
        alert(`Player profile created successfully! Transaction signature: ${data.signature}`);
        // Fetch the newly created profile
        await fetchProfile();
      } else {
        throw new Error(data.message || 'Failed to initialize player');
      }
    } catch (err) {
      console.error('❌ Error initializing player:', err);
      setError(`Failed to initialize player: ${err.message}`);
      alert(`Error creating profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🟡 Solana Wallet Connect Demo</h1>

      <WalletMultiButton />

      {connected && (
        <>
          <button
            onClick={fetchProfile}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '8px',
              backgroundColor: '#ffaa00',
              color: 'white',
              border: 'none',
              boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : '📡 Fetch Profile'}
          </button>

          {error && (
            <p style={{ color: 'red', margin: '20px 0' }}>{error}</p>
          )}

          {profile && (
            <div style={{ margin: '20px auto', maxWidth: '600px' }}>
              <h2>Player Profile</h2>
              <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
