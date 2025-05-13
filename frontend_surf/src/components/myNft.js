import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddressSync, getTokenMetadata } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Loader2, UploadCloud } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BN } from 'bn.js';
import { WalletConnectButton } from './WalletConnectButton';

const fetchMetadataFromUri = async (uri) => {
  try {
    const response = await axios.get(uri);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch metadata from URI:', error);
    return null;
  }
};

const MyNFTs = ({ program, connection }) => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [myNfts, setMyNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNftToList, setSelectedNftToList] = useState(null);
  const [listingPrice, setListingPrice] = useState('');
  const [listingError, setListingError] = useState(null);
  const [isListing, setIsListing] = useState(false);

  const navigate = useNavigate();

  const fetchMyNFTs = useCallback(async () => {
    if (!publicKey || !connected || !connection) return;

    setLoading(true);
    setError(null);

    try {
      // Get all token accounts with balance > 0
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_2022_PROGRAM_ID
        }
      );

      // Filter for NFTs (balance = 1) and get mint addresses
      const mintAddresses = tokenAccounts.value
        .filter(account => account.account.data.parsed.info.tokenAmount.uiAmount === 1)
        .map(account => account.account.data.parsed.info.mint);

      // Fetch metadata for each NFT
      const nftDetails = await Promise.all(
        mintAddresses.map(async (mint) => {
          try {
            const metadata = await getTokenMetadata(connection, new PublicKey(mint));
            const uriMetadata = await fetchMetadataFromUri(metadata.uri.toString());
            return {
              mint,
              name: metadata.name,
              image: uriMetadata?.image,
            };
          } catch (err) {
            console.error(`Failed to fetch metadata for ${mint}:`, err);
            return null; // Skip invalid NFTs
          }
        })
      );

      // Filter out null values and set state
      setMyNfts(nftDetails.filter(nft => nft !== null));
    } catch (err) {
      console.error("Failed to fetch my NFTs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, connection]);

  useEffect(() => {
    fetchMyNFTs();
  }, [fetchMyNFTs]);

  const handleListNft = (nft) => {
    setSelectedNftToList(nft);
    setListingPrice('');
    setListingError(null);
  };

  const handleListNow = async () => {
    if (!selectedNftToList || !listingPrice || isNaN(parseFloat(listingPrice))) {
      setListingError("Please enter a valid listing price.");
      return;
    }

    if (parseFloat(listingPrice) <= 0) {
      setListingError("Price must be greater than 0.");
      return;
    }

    if (!signTransaction) {
      setListingError("Please connect your wallet to list NFTs.");
      return;
    }

    setIsListing(true);
    setListingError(null);

    try {
      const priceLamports = new BN(parseFloat(listingPrice) * 1_000_000_000);
      const mintPublicKey = new PublicKey(selectedNftToList.mint);

      // Get PDAs
      const [playerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('player'), publicKey.toBytes()],
        program.programId
      );
      const [walletPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('wallet'), publicKey.toBytes()],
        program.programId
      );
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), publicKey.toBytes(), mintPublicKey.toBytes()],
        program.programId
      );

      // Get token accounts
      const sellerTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const escrowTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        escrowPDA,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check/create escrow token account
      try {
        await getAccount(connection, escrowTokenAccount, 'confirmed', TOKEN_2022_PROGRAM_ID);
      } catch {
        const createTokenAccountTx = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            escrowTokenAccount,
            escrowPDA,
            mintPublicKey,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        createTokenAccountTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        createTokenAccountTx.feePayer = publicKey;

        const signedCreateTx = await signTransaction(createTokenAccountTx);
        const createTxid = await connection.sendRawTransaction(signedCreateTx.serialize());
        await connection.confirmTransaction(createTxid, 'confirmed');
      }

      // Create listing instruction
      const listIx = await program.methods
        .listNft(priceLamports)
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
        })
        .instruction();

      // Send transaction
      const transaction = new Transaction().add(listIx);
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(txid, 'confirmed');

      // Update UI
      setMyNfts(prev => prev.filter(nft => nft.mint !== selectedNftToList.mint));
      setSelectedNftToList(null);
      setListingPrice('');

      alert(`${selectedNftToList.name} listed successfully for ${listingPrice} SOL!`);
      navigate("/list");
    } catch (err) {
      console.error("Failed to list NFT:", err);
      setListingError(err.message || "Failed to list NFT");
    } finally {
      setIsListing(false);
    }
  };

  if (!connected) {
    return <p className="text-gray-400">Connect your wallet to view and list your NFTs.</p>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400">Error loading your NFTs: {error}</p>;
  }

  if (myNfts.length === 0) {
    return <p className="text-gray-400">You don't have any NFTs in your wallet.</p>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-200">Your Collection</h2>
        <span className="inline-flex items-center rounded-full bg-gray-800 px-3 py-0.5 text-sm font-medium text-gray-400">
          {myNfts.length} NFTs
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin h-10 w-10 text-purple-500" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-900/20 p-4">
          <p className="text-sm font-medium text-red-400">
            Error loading your NFTs: {error}
          </p>
        </div>
      ) : myNfts.length === 0 ? (
        <div className="rounded-xl bg-gray-800/50 p-8 text-center border border-gray-700/50">
          <div className="max-w-md mx-auto">
            <WalletConnectButton />
            <p className="mt-4 text-gray-500 text-sm">
              Connect your wallet to see your precious NFTs.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {myNfts.map((nft, index) => (
            <div
              key={index}
              className="group relative rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:border-purple-500/40"
            >
              <div className="aspect-[4/3] overflow-hidden">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x150?text=No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white truncate">{nft.name}</h3>
                <button
                  onClick={() => handleListNft(nft)}
                  className="relative mt-3 w-full inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <UploadCloud className="h-4 w-4 mr-2" />
                  List NFT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNftToList && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="relative bg-gray-900 rounded-2xl shadow-lg border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-200">
                  List <span className="text-purple-400">{selectedNftToList.name}</span>
                </h3>
                <button
                  onClick={() => setSelectedNftToList(null)}
                  className="text-gray-500 hover:text-gray-400 focus:outline-none transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                {selectedNftToList.image ? (
                  <img
                    src={selectedNftToList.image}
                    alt={selectedNftToList.name}
                    className="w-full h-32 object-cover rounded-lg mb-4 shadow-md"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x80?text=No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
                      Listing Price (SOL)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="price"
                        className="block w-full rounded-md border-gray-700 bg-gray-800 text-white py-2 px-3 pr-10 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">SOL</span>
                      </div>
                    </div>
                  </div>
                  {listingError && (
                    <p className="mt-2 text-sm text-red-500">{listingError}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedNftToList(null)}
                  className="rounded-md border border-gray-600 bg-gray-800 py-2 px-4 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleListNow}
                  disabled={isListing}
                  className={`inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isListing ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                  {isListing ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Listing...
                    </span>
                  ) : (
                    'List Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
