import React, { useEffect, useState } from 'react';
import BN from "bn.js";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Connection,
  Transaction,
  Keypair,
  SystemProgram,
  PublicKey,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';
import { Buffer } from 'buffer';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccountInstruction,
  mintTo
} from "@solana/spl-token";
const PROGRAM_ID = new PublicKey('A9YHxLTPtT6YSCi793gNFMB4nUTByXhq9DzgKf169Zf');
const RPC_URL = 'http://127.0.0.1:8899';

const IDL = require('./idl/surf.json'); // You'll need to have this file available
window.Buffer = Buffer;
function App() {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nftLoading, setNftLoading] = useState(false);
  const [nftMinted, setNftMinted] = useState(false);
  const [nftSignature, setNftSignature] = useState('');

  const connection = new Connection(RPC_URL, 'confirmed');
  const getProgram = () => {
    const walletAdapter = {
      publicKey,
      signTransaction,
      signAllTransactions: async (txs) => Promise.all(txs.map(tx => signTransaction(tx)))
    };
    const provider = new anchor.AnchorProvider(connection, walletAdapter, { commitment: 'confirmed' });
    return new anchor.Program(IDL, PROGRAM_ID, provider);
  };

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
      const connection = new Connection(RPC_URL, 'confirmed');

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

  const mintHighScoreNFT = async () => {
    if (!publicKey || !signTransaction || !profile) {
      alert("Wallet not connected or profile not found");
      return;
    }

    setNftLoading(true);
    setError(null);

    try {
      const program = getProgram();

      const highScore = profile.highScore || 0;
      const name = `Surf High Score: ${highScore}`;
      const symbol = "SURF";
      const uri = "https://arweave.net/MHK3Iopy0GgvDoM7LkkiAdg7pQqExuuWvedApCnzfj0";

      const mint = Keypair.generate();

      const [playerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("player"), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [walletPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("wallet"), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [nftPDA] = PublicKey.findProgramAddressSync([Buffer.from("nft_authority")], PROGRAM_ID)
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const ix = await program.methods
        .mintNft(uri, name, symbol)
        .accounts({
          signer: publicKey,
          player: playerPDA,
          tokenAccount: destinationTokenAccount,
          nftAuthority: nftPDA,
          wallet: walletPDA,
          mint: mint.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;
      tx.partialSign(mint);

      const signed = await signTransaction(tx);
      const txid = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txid, 'confirmed');

      setNftSignature(txid);
      setNftMinted(true);
      alert(`✅ NFT Minted! TX: ${txid}`);
    } catch (err) {
      console.error("❌ NFT Minting Error:", err);
      setError(err.message);
      alert(`Minting failed: ${err.message}`);
    } finally {
      setNftLoading(false);
    }
  };
  // Function to check if player has a high score worth minting
  const hasHighScore = () => {
    return profile && profile.highScore && profile.highScore >= 0;
  };


  const updateHighScoreNft = async () => {
    if (!publicKey || !signTransaction || !profile || !profile.highscoreNftMint) {
      alert("Wallet not connected or profile not found");
      return;
    }

    setNftLoading(true);
    setError(null);

    try {
      const program = getProgram();

      const highScore = new BN(222)

      const mintPublicKey = new PublicKey(profile.highscoreNftMint)

      const [playerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("player"), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [nftPDA] = PublicKey.findProgramAddressSync([Buffer.from("nft_authority")], PROGRAM_ID)
      const ix = await program.methods
        .updateNft(new BN(highScore))
        .accounts({
          signer: publicKey,
          player: playerPDA,
          nftAuthority: nftPDA,
          mint: mintPublicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;

      const signed = await signTransaction(tx);
      const txid = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txid, 'confirmed');

      setNftSignature(txid);
      alert(`✅ NFT updated! TX: ${txid}`);
    } catch (err) {
      console.error("❌ Error updating NFT:", err);
      setError(err.message);
      alert(`Updating failed: ${err.message}`);
    } finally {
      setNftLoading(false);
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

              {hasHighScore() && (
                <button
                  onClick={mintHighScoreNFT}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: nftLoading ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    backgroundColor: '#9945FF',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
                    opacity: nftLoading ? 0.7 : 1,
                  }}
                  disabled={nftLoading || nftMinted}
                >
                  {nftLoading ? 'Minting...' : nftMinted ? '🎉 NFT Minted!' : '🖼️ Mint High Score NFT'}
                </button>
              )}

              {profile.highscoreNftMint && (
                <button
                  onClick={updateHighScoreNft}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: nftLoading ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    backgroundColor: '#ffaa00',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
                    opacity: nftLoading ? 0.7 : 1,
                  }}
                  disabled={nftLoading}
                >
                  {nftLoading ? 'Updating...' : '🔄 Update High Score NFT'}
                </button>
              )}

              {nftMinted && nftSignature && (
                <div style={{ marginTop: '20px' }}>
                  <p>NFT minted successfully!</p>
                  <a
                    href={`https://explorer.solana.com/tx/${nftSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#9945FF' }}
                  >
                    View transaction on Solana Explorer
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
