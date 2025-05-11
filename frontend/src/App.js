import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  Transaction,
  PublicKey,
  Keypair,
  SystemProgram,
} from "@solana/web3.js";
import { Buffer } from 'buffer';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import PlayerProfile from './components/PlayerProfile';
import DevnetFaucet from './components/requestAirdrop';
import ListedNfts from './components/getNFT';
import ListNftButton from './components/listNFT';
import HighScoreNftActions from './components/HighScoreNftActions';
import useProgram from './hooks/useProgram';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import * as anchor from '@project-serum/anchor';

window.Buffer = Buffer;

const PROGRAM_ID = new anchor.web3.PublicKey('4pzvADeMCm62GziZvTfEMTeoYnraQJJmN5tAdqd6ARSM');

const RPC_URL = 'https://api.devnet.solana.com';
function App() {
  const { publicKey, connected, signTransaction } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nftLoading, setNftLoading] = useState(false);
  const [nftMinted, setNftMinted] = useState(false);
  const [nftSignature, setNftSignature] = useState('');
  const [nftError, setNftError] = useState(null);
  const program = useProgram();
  const connection = new Connection(RPC_URL, 'confirmed');

  useEffect(() => {
    if (connected && publicKey) {
      console.log('✅ Wallet connected:', publicKey.toBase58());
      fetchProfile();
    }
  }, [connected, publicKey]);



  const fetchProfile = async () => {
    if (!publicKey || !program) return;

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const playerSeed = new TextEncoder().encode('player');
      const [playerPDA] = PublicKey.findProgramAddressSync(
        [playerSeed, publicKey.toBytes()],
        PROGRAM_ID
      );

      const profileAccount = await program.account.playerProfile.fetch(playerPDA);
      console.log('🎯 Profile fetched:', profileAccount);
      setProfile(profileAccount);

    } catch (err) {
      if (err.message?.includes('Account does not exist') || err.code === 0) {
        console.log('Profile not found');

        if (!window.profileInitPromptShown) {
          window.profileInitPromptShown = true;
          const shouldInitialize = window.confirm(
            'Player profile not found. Would you like to create one?'
          );

          if (shouldInitialize) {
            await initPlayer();
          }
        }
      } else {
        console.error('❌ Error fetching profile:', err);
        setError(`Failed to fetch profile: ${err.message}`);
      }
    } finally {
      setLoading(false);
      window.profileInitPromptShown = false;
    }
  };
  const initPlayer = async () => {
    if (!publicKey || !signTransaction || !program) {
      alert("Wallet not connected or doesn't support signing or program not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Creating initialization transaction...');

      const playerSeed = new TextEncoder().encode('player');
      const walletSeed = new TextEncoder().encode('wallet');
      console.log(publicKey)
      const [playerPDA] = PublicKey.findProgramAddressSync(
        [playerSeed, publicKey.toBytes()],
        PROGRAM_ID
      );

      const [walletPDA] = PublicKey.findProgramAddressSync(
        [walletSeed, publicKey.toBytes()],
        PROGRAM_ID
      );

      const tx = await program.methods
        .initPlayer()
        .accounts({
          playerAccount: playerPDA,
          signer: publicKey,
          wallet: walletPDA,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;

      console.log('🔑 Signing transaction...');
      const signedTx = await signTransaction(tx);

      console.log('📡 Sending transaction to Solana...');
      const rawTx = signedTx.serialize();
      const txSig = await connection.sendRawTransaction(rawTx);

      console.log('⏳ Confirming transaction...');
      await connection.confirmTransaction(txSig, 'confirmed');

      console.log('✅ Player initialized!', txSig);
      alert(`Player profile created successfully! Transaction signature: ${txSig}`);

      await fetchProfile();
    } catch (err) {
      console.error('❌ Error initializing player:', err);
      setError(`Failed to initialize player: ${err.message}`);
      alert(`Error creating profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  const mintHighScoreNFT = async () => {
    if (!publicKey || !signTransaction || !profile || !program) {
      alert("Wallet not connected or profile not found or program not initialized");
      return;
    }

    setNftLoading(true);
    setError(null);

    try {
      const highScore = profile.highScore || 0;
      const name = `Surf High Score: ${highScore}`;
      const symbol = "SURF";
      const uri = "https://bronze-circular-anteater-873.mypinata.cloud/ipfs/bafkreicqxfgqgujfk3selkf64v4llacajnkgdleh3eyjxpl2tz4gvcp2hy";
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
      const metadataVec = [
        { key: "bg", value: "ff" },
        { key: "fgg", value: "ff" },
        { key: "speed", value: "fast" },
      ];
      const ix = await program.methods
        .mintNft(uri, name, symbol, false, null, metadataVec)
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

  const updateHighScoreNft = async () => {
    if (!publicKey || !signTransaction || !profile || !profile.highscoreNftMint || !program) {
      alert("Wallet not connected or profile not found or NFT mint not found or program not initialized");
      return;
    }

    setNftLoading(true);
    setError(null);

    try {
      const highScore = new anchor.BN(222);
      const mintPublicKey = new PublicKey(profile.highscoreNftMint);
      const [playerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("player"), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const [nftPDA] = PublicKey.findProgramAddressSync([Buffer.from("nft_authority")], PROGRAM_ID);
      const ix = await program.methods
        .updateNft(highScore)
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
      <h1>🟡 Solana NFT Marketplace</h1>

      <WalletMultiButton />

      <DevnetFaucet />
      {connected && (
        <>
          <button
            onClick={fetchProfile}
            style={buttonStyle(loading)}
            disabled={loading}
          >
            {loading ? 'Processing...' : '📡 Fetch Profile'}
          </button>

          {error && (
            <p style={{ color: 'red', margin: '20px 0' }}>{error}</p>
          )}

          {profile && (
            <>
              <PlayerProfile profile={profile} />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '30px',
                marginTop: '40px'
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: '800px',
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <HighScoreNftActions
                    profile={profile}
                    mintHighScoreNFT={mintHighScoreNFT}
                    updateHighScoreNft={updateHighScoreNft}
                    nftLoading={nftLoading}
                    nftMinted={nftMinted}
                    nftSignature={nftSignature}
                  />
                  <ListNftButton
                    program={program}
                    publicKey={publicKey}
                    signTransaction={signTransaction}
                    connection={connection}
                    profile={profile}
                  />
                </div>

                <div style={{
                  width: '100%',
                  maxWidth: '1200px',
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <h2>Marketplace Listings</h2>
                  <ListedNfts program={program} />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const buttonStyle = (loading) => ({
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
});

export default App;
