import React from 'react';

const HighScoreNftActions = ({
  profile,
  mintHighScoreNFT,
  updateHighScoreNft,
  nftLoading,
  nftMinted,
  nftSignature,
}) => {
  const hasHighScore = () => {
    return profile && profile.highScore >= 0;
  };

  return (
    <div>
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
      {profile?.highscoreNftMint && (
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
  );
};

export default HighScoreNftActions;
