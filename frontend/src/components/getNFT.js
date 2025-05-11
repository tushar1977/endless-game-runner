import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

const ListedNfts = ({ program }) => {
  const { publicKey } = useWallet();
  const [listedNfts, setListedNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchListedNfts = async () => {
    if (!program) return;

    setLoading(true);
    setError(null);

    try {
      const escrowAccounts = await program.account.escrow.all();
      const activeListings = escrowAccounts.filter(acc => !acc.account.isClosed);

      const listings = activeListings.map(acc => ({
        escrowAccount: acc.publicKey.toString(),
        seller: acc.account.seller.toString(),
        price: acc.account.price / 1_000_000_000,
        mint: acc.account.skinToList.toString(),
        escrowTokenAccount: getAssociatedTokenAddressSync(
          acc.account.skinToList,
          acc.publicKey,
          true,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ).toString()
      }));

      setListedNfts(listings);
    } catch (err) {
      console.error("Failed to fetch escrow listings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListedNfts();
  }, [program, publicKey]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>NFTs in Escrow</h2>

      {!publicKey ? (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <WalletMultiButton />
          <p>Connect your wallet to view escrow listings</p>
        </div>
      ) : loading ? (
        <div>Loading escrow listings...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : listedNfts.length === 0 ? (
        <div>No active NFT listings found</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {listedNfts.map((nft, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <h3>NFT Mint: {nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}</h3>
              <div style={{ margin: '10px 0' }}>
                <p><strong>Price:</strong> {nft.price} SOL</p>
                <p><strong>Seller:</strong> {nft.seller.slice(0, 4)}...{nft.seller.slice(-4)}</p>
                <p><strong>Escrow Account:</strong> {nft.escrowAccount.slice(0, 4)}...{nft.escrowAccount.slice(-4)}</p>
                <p><strong>Token Account:</strong> {nft.escrowTokenAccount.slice(0, 4)}...{nft.escrowTokenAccount.slice(-4)}</p>
              </div>

              {/* Placeholder for buy action */}
              <button
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListedNfts;
