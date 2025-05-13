import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddressSync, getTokenMetadata } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getParsedProgramAccounts } from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Loader2, UploadCloud } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BN } from 'bn.js';

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
      const tokenAccounts = await connection.getParsedProgramAccounts(
        TOKEN_2022_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: 170,
            },
            {
              memcmp: {
                offset: 32,
                bytes: publicKey.toBase58(),
              },
            },
          ],
        }
      );
      console.log(tokenAccounts)


      const mintAddresses = tokenAccounts.reduce((acc, accountInfo) => {
        const account = accountInfo.account.data.parsed.info;
        acc.push(account.mint);
        return acc;
      }, []);

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
            return { mint, name: 'Unknown', image: null };
          }
        })
      );

      setMyNfts(nftDetails);
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
    console.log("NFT to list:", nft);
    setSelectedNftToList(nft);
    setListingPrice('');
    setListingError(null);
  };

  const handleListNow = async () => {
    if (!selectedNftToList || !listingPrice || isNaN(parseFloat(listingPrice)) || parseFloat(listingPrice) <= 0) {
      setListingError("Please enter a valid listing price.");
      return;
    }

    if (!signTransaction) {
      alert("Please connect your wallet to list NFTs.");
      return;
    }

    setIsListing(true);
    setListingError(null);

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
    try {

      const priceLamports = new BN(parseFloat(listingPrice) * 1_000_000_000);
      const mintPublicKey = new PublicKey(selectedNftToList.mint);
      const sellerTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), publicKey.toBytes(), mintPublicKey.toBytes()],
        program.programId
      );

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

      console.log(priceLamports)
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

      const transaction = new Transaction().add(listIx);
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTransaction = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(txid, 'processed');

      alert(`${selectedNftToList.name} listed successfully for ${listingPrice} SOL!`);
      navigate("/list")
      setSelectedNftToList(null);
      setListingPrice('');
      fetchMyNFTs(); // Refresh the list
    } catch (err) {
      console.error("Failed to list NFT:", err);
      setListingError(err.message);
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
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">My NFTs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {myNfts.map((nft, index) => (
          <div key={index} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {nft.image && (
              <img src={nft.image} alt={nft.name} className="w-full h-32 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-white">{nft.name}</h3>
              <p className="text-gray-400 text-sm mb-2 truncate">{nft.mint}</p>
              <button
                onClick={() => handleListNft(nft)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <UploadCloud className="h-4 w-4 inline-block mr-1" /> List NFT
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedNftToList && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900/80 flex justify-center items-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">List {selectedNftToList.name}</h2>
            {selectedNftToList.image && (
              <img src={selectedNftToList.image} alt={selectedNftToList.name} className="w-32 h-32 object-cover rounded-md mb-4 mx-auto" />
            )}
            <p className="text-gray-400 mb-2">Mint Address: <span className="text-gray-300 truncate">{selectedNftToList.mint}</span></p>
            <div className="mb-4">
              <label htmlFor="listingPrice" className="block text-gray-300 text-sm font-bold mb-2">
                Listing Price (SOL):
              </label>
              <input
                type="number"
                id="listingPrice"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter price"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
              />
              {listingError && <p className="text-red-500 text-xs italic">{listingError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedNftToList(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleListNow}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isListing ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isListing || !signTransaction}
              >
                {isListing ? <Loader2 className="animate-spin h-4 w-4 inline-block mr-1" /> : <UploadCloud className="h-4 w-4 inline-block mr-1" />} List Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
