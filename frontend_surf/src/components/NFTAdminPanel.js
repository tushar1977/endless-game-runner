import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Copy, ChevronDown, ChevronUp, Download, Maximize2, Info, Heart, BarChart3, Share2, ShoppingCart } from 'lucide-react';
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddressSync, getTokenMetadata, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Import your CSS file (assuming you create one named NFTDetails.css)
import '../NFTDetails.css';

const fetchMetadataFromUri = async (uri) => {
  try {
    const response = await axios.get(uri);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch metadata from URI:', error);
    return null;
  }
};

const NFTAdminPanel = ({ program, connection }) => {
  const { mintAddress } = useParams();
  const location = useLocation()
  const sellerPublicKey = location.state?.seller;
  console.log(sellerPublicKey)
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    attributes: true,
    description: true
  });
  const [imageSize, setImageSize] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nftData, setNftData] = useState(null);
  const { disconnect } = useWallet();
  const navigate = useNavigate();

  const { publicKey, connected, signTransaction } = useWallet();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const cycleImageSize = () => {
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(imageSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setImageSize(sizes[nextIndex]);
  };
  const handleDisconnect = useCallback(() => {
    disconnect().then(() => {
      console.log('Wallet disconnected');
      // No need to do anything here, the page will not refresh
    }).catch(err => {
      console.error("Error disconnecting wallet", err);
    });
  }, [disconnect]);

  const handleBuyNowClick = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!publicKey) {
        setError("Wallet not connected.");
        setLoading(false);
        return;
      }
      if (!sellerPublicKey) {
        setError("Seller public key not found.");
        setLoading(false);
        return;
      }

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
      const mintPublicKey = new PublicKey(mintAddress);

      const buyerTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log("Buyer Token Account:", buyerTokenAccount.toString());
      try {
        await getAccount(connection, buyerTokenAccount, 'confirmed', TOKEN_2022_PROGRAM_ID)
      } catch (e) {
        const createTokenAccountTx = new Transaction();
        const tix = createAssociatedTokenAccountInstruction(publicKey, buyerTokenAccount, publicKey, mintPublicKey, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID)

        createTokenAccountTx.add(tix)
        createTokenAccountTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        createTokenAccountTx.feePayer = publicKey;

        const signedCreateTx = await signTransaction(createTokenAccountTx);
        const createTxid = await connection.sendRawTransaction(signedCreateTx.serialize());
        console.log("Token account creation tx sent:", createTxid);
        await connection.confirmTransaction(createTxid, 'confirmed');
        console.log("Token account created successfully");
      }
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('escrow'),
          new PublicKey(sellerPublicKey).toBytes(),
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

      const buyIx = await program.methods
        .buyNft()
        .accounts({
          buyer: publicKey,
          seller: new PublicKey(sellerPublicKey),
          player: playerPDA,
          wallet: walletPDA,
          nftMint: mintPublicKey,
          buyerTokenAccount: buyerTokenAccount,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();

      const transaction = new Transaction().add(buyIx);
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTransaction = await signTransaction(transaction);
      console.log('Signed Transaction:', signedTransaction);

      const txid = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      console.log('Transaction ID:', txid);

      await connection.confirmTransaction(txid, 'processed');
      console.log('Transaction Confirmed:', txid);

      alert('NFT purchased successfully!');
      navigate('/marketplace');

    } catch (e) {
      setError(e);
      console.error("Error during buy:", e);
      alert(`Error buying NFT: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchNftDetails = async () => {
      if (!mintAddress) {
        setError("NFT Mint Address is required.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const metadata = await getTokenMetadata(program.provider.connection, new PublicKey(mintAddress));
        const uriMetadata = await fetchMetadataFromUri(metadata.uri);
        setNftData({
          ...uriMetadata,
          mintAddress // Keep mint address for reference
        });
      } catch (err) {
        console.error("Failed to fetch NFT metadata:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch NFT metadata.");
      } finally {
        setLoading(false);
      }
    };

    fetchNftDetails();
  }, [mintAddress, program]);

  const CopyButton = ({ text }) => {
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    };

    return (
      <button
        className="copy-button"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
      >
        <Copy size={14} />
      </button>
    );
  };

  if (loading) {
    return <div className="nft-details-container loading">Loading NFT details...</div>;
  }

  if (error) {
    return <div className="nft-details-container error">Error loading NFT details: {error}</div>;
  }

  if (!nftData) {
    return <div className="nft-details-container not-found">NFT not found.</div>;
  }

  return (

    <div className="nft-details-container">
      <div className="nft-card">
        <div className="nft-image-container">
          <div className={`nft-image-wrapper ${imageSize}`}>
            {nftData.image && (
              <>
                <img
                  src={nftData.image}
                  alt={nftData.name || 'NFT image'}
                  className="nft-image"
                />
                <div className="nft-image-actions">
                  <button className="image-action-button" aria-label="Download">
                    <Download size={16} />
                  </button>
                  <button className="image-action-button" onClick={cycleImageSize} aria-label="Resize image">
                    <Maximize2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="nft-details">
          <div className="nft-header">
            <div>
              <h1 className="nft-title">{nftData.name || 'Unnamed NFT'}</h1>
              {nftData.symbol && <p className="nft-symbol">{nftData.symbol}</p>}
            </div>

            <WalletMultiButton onClick={handleDisconnect} />
            <button className="buy-now-button" onClick={handleBuyNowClick}>
              <ShoppingCart size={18} /> Buy Now
            </button>
          </div>

          <div className="nft-section">
            <div className="section-header">
              <h2 className="section-title">Description</h2>
              <button onClick={() => toggleSection('description')} className="section-toggle-button" aria-label="Toggle description section">
                {expandedSections.description ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {expandedSections.description && (
              <p className="nft-description">{nftData.description || 'No description available.'}</p>
            )}
          </div>

          <div className="nft-section">
            <div className="section-header">
              <h2 className="section-title">Details</h2>
              <button onClick={() => toggleSection('details')} className="section-toggle-button" aria-label="Toggle details section">
                {expandedSections.details ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {expandedSections.details && (
              <div className="details-list">
                {nftData.mintAddress && (
                  <div className="detail-item">
                    <span className="detail-label">Mint Address</span>
                    <div className="detail-value">
                      <span className="truncate">{nftData.mintAddress}</span>
                      <CopyButton text={nftData.mintAddress} />
                    </div>
                  </div>
                )}
                {nftData.edition !== undefined && (
                  <div className="detail-item">
                    <span className="detail-label">Edition</span>
                    <span className="detail-value">{nftData.edition}</span>
                  </div>
                )}
                {nftData.properties?.category && (
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{nftData.properties.category}</span>
                  </div>
                )}
                {/* Add other relevant details here */}
              </div>
            )}
          </div>

          <div className="nft-section">
            <div className="section-header">
              <h2 className="section-title">Attributes <span className="attribute-count">({nftData.attributes?.length || 0})</span></h2>
              <button onClick={() => toggleSection('attributes')} className="section-toggle-button" aria-label="Toggle attributes section">
                {expandedSections.attributes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {expandedSections.attributes && nftData.attributes && (
              <div className="attributes-grid">
                {nftData.attributes.map((attr, index) => (
                  <div key={index} className="attribute-item">
                    <p className="attribute-label">{attr.trait_type || attr.type}</p>
                    <p className="attribute-value">{attr.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nft-actions">
            <button className="action-button like-button">
              <Heart size={16} /> Like
            </button>
            <button className="action-button stats-button">
              <BarChart3 size={16} /> Stats
            </button>
            <button className="action-button share-button">
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};

export default NFTAdminPanel;
