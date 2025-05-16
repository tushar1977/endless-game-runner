import React, { useState } from 'react';
import { Connection, PublicKey, sendAndConfirmRawTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, getAccount, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navbarRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
const ListNftButton = ({ program, publicKey, signTransaction, connection, profile }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txSignature, setTxSignature] = useState('');

  const listNFT = async () => {
    if (!publicKey || !signTransaction || !profile?.highscoreNftMint || !program) {
      alert("Wallet not connected, profile/NFT missing, or program not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const playerSeed = new TextEncoder().encode('player');
      const walletSeed = new TextEncoder().encode('wallet');

      const [playerPDA] = PublicKey.findProgramAddressSync(
        [playerSeed, publicKey.toBytes()],
        program.programId
      );

      const [walletPDA] = PublicKey.findProgramAddressSync(
        [walletSeed, publicKey.toBytes()],
        program.programId
      );

      console.log(playerPDA)

      const mintPublicKey = new PublicKey(profile.skinsOwned[0]);
      console.log("Mint Public Key:", mintPublicKey.toString());

      const sellerTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      console.log("Seller Token Account:", sellerTokenAccount.toString());

      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('escrow'),
          publicKey.toBytes(),
          mintPublicKey.toBytes()
        ],
        program.programId
      );
      console.log("Escrow PDA:", escrowPDA.toString());

      const escrowTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        escrowPDA,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      console.log("Escrow Token Account:", escrowTokenAccount.toString());
      try {
        await getAccount(connection, escrowTokenAccount, 'confirmed', TOKEN_2022_PROGRAM_ID)
      }
      catch (e) {
        const createTokenAccountTx = new Transaction();
        const tix = createAssociatedTokenAccountInstruction(publicKey, escrowTokenAccount, escrowPDA, mintPublicKey, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID)

        createTokenAccountTx.add(tix)
        createTokenAccountTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        createTokenAccountTx.feePayer = publicKey;

        const signedCreateTx = await signTransaction(createTokenAccountTx);
        const createTxid = await connection.sendRawTransaction(signedCreateTx.serialize());
        console.log("Token account creation tx sent:", createTxid);
        await connection.confirmTransaction(createTxid, 'confirmed');
        console.log("Token account created successfully");
      }
      const price = new anchor.BN(1_000_000_000);
      console.log("Listing price:", price.toString());

      const ix = await program.methods
        .listNft(price)
        .accounts({
          signer: publicKey,
          player: playerPDA,
          wallet: walletPDA,
          skinToList: mintPublicKey,
          skinToListTokenAccount: sellerTokenAccount,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;

      const signed = await signTransaction(tx);
      const txid = await connection.sendRawTransaction(signed.serialize());
      console.log("Transaction sent:", txid);
      await connection.confirmTransaction(txid, 'confirmed');

      setTxSignature(txid);
      alert(`✅ NFT listed for sale! TX: ${txid}`);
    } catch (err) {
      console.error("❌ Error listing NFT:", err);
      const errorMessage = err.logs ? err.logs.join('\n') : err.message;
      setError(errorMessage);
      alert(`Listing failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  return (
     
    <div style={{ margin: '20px 0' }}>
      <button
        onClick={listNFT}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          borderRadius: '8px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
          opacity: loading ? 0.7 : 1,
        }}
        disabled={loading || !profile?.highscoreNftMint}
      >
        {loading ? 'Processing...' : '🏷️ List NFT for Sale'}
      </button>

      {error && (
        <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>
      )}

      {txSignature && (
        <p style={{ margin: '10px 0' }}>
          Transaction: <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4CAF50' }}
          >
            View on Explorer
          </a>
        </p>
      )}
    </div>
  );
}};

export default ListNftButton;

