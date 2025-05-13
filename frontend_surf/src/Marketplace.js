import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddressSync, getTokenMetadata } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ShoppingCart, Search, Menu, X, Heart, Award, Cpu, Disc, Loader2 } from 'lucide-react';
import axios from 'axios';
import './marketplace.css'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const fetchMetadataFromUri = async (uri) => {
  try {
    const response = await axios.get(uri);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch metadata from URI:', error);
    return null;
  }
};

const ListedNfts = ({ program, viewDetails }) => {
  const { publicKey } = useWallet();
  const [listedNfts, setListedNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { connected } = useWallet();
  const fetchListedNfts = async () => {
    if (!program || !program.provider) return;

    setLoading(true);
    setError(null);

    try {
      const escrowAccounts = await program.account.escrow.all();
      const activeListings = escrowAccounts.filter(acc => !acc.account.isClosed);

      const listingsPromises = activeListings.map(async (acc) => {
        const mintAddress = acc.account.skinToList;
        const escrowAccount = acc.publicKey;

        const metadata = await getTokenMetadata(program.provider.connection, mintAddress);
        const uri_metadata = await fetchMetadataFromUri(metadata.uri.toString())
        let nftData = {
          escrowAccount: escrowAccount.toString(),
          seller: acc.account.seller.toString(),
          price: acc.account.price / 1_000_000_000,
          mint: mintAddress.toString(),
          escrowTokenAccount: getAssociatedTokenAddressSync(
            mintAddress,
            escrowAccount,
            true,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          ).toString(),
          image: uri_metadata?.image,
          name: metadata.name,
          sellerShort: `${acc.account.seller.toString().slice(0, 4)}...${acc.account.seller.toString().slice(-4)}`
        };

        return nftData;
      });

      const listings = await Promise.all(listingsPromises);
      setListedNfts(listings);
    } catch (err) {
      console.error("Failed to fetch escrow listings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // This will run when wallet connection changes
    console.log('Wallet connection changed:');
    // You might want to fetch NFTs again when wallet changes
  }, [connected]);

  useEffect(() => {
    fetchListedNfts();
  }, [program]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-12 w-12 text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
        <p className="text-red-400">Error loading listings: {error}</p>
        <button
          onClick={fetchListedNfts}
          className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (listedNfts.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">No NFTs currently listed for sale</p>
        <button
          onClick={fetchListedNfts}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Refresh Listings
        </button>
      </div>
    );
  }


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listedNfts.map((nft, index) => (
        <div key={index} className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 border border-gray-700">
          <div className="relative">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-gray-900/70 text-white px-2 py-1 rounded-md text-sm">
              {nft.price} SOL
            </div>
          </div>

          <div className="p-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-white">{nft.name}</h3>
              <span className="text-purple-400 text-sm">#{index + 1}</span>
            </div>

            <p className="text-gray-400 text-sm mb-3">{nft.description}</p>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Seller</p>
                <p className="text-xs text-gray-300">{nft.sellerShort}</p>
              </div>
              <button onClick={() => viewDetails(nft.mint, nft.seller)}>View Details</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Logo Component
const Logo = () => (
  <div className="flex items-center gap-2">
    <Cpu size={28} className="text-purple-500" />
    <span className="font-bold text-xl bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">CryptoGamers</span>
  </div>
);

// Navigation Component
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 py-4 px-6 border-b border-gray-800">

      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search NFTs..."
              className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500 h-5 w-5" />
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white">
              <Heart size={20} />
            </button>
            <button className="text-gray-400 hover:text-white">
              <ShoppingCart size={20} />
            </button>

            <WalletMultiButton />
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search NFTs..."
              className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500 h-5 w-5" />
          </div>

          <div className="flex justify-around">
            <button className="flex flex-col items-center text-gray-400 hover:text-white">
              <Heart size={20} />
              <span className="text-sm mt-1">Favorites</span>
            </button>
            <button className="flex flex-col items-center text-gray-400 hover:text-white">
              <ShoppingCart size={20} />
              <span className="text-sm mt-1">Cart</span>
            </button>
          </div>
        </div>
      )}

    </nav>
  );
};

// Categories Component
const Categories = () => {
  const categories = [
    { name: "All Items", icon: <Disc className="h-4 w-4" /> },
  ];

  return (
    <div className="flex overflow-x-auto py-4 gap-2 scrollbar-hide">
      {categories.map((category, index) => (
        <button
          key={index}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm ${index === 0
            ? "bg-purple-600 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
        >
          {category.icon}
          {category.name}
        </button>
      ))}
    </div>
  );
};

// Main App
export default function NFTMarketplace({ program }) {
  const navigate = useNavigate()
  const viewDetails = (mintAddress, seller) => {
    navigate(`/nft/${mintAddress}`, { state: { seller: seller } });
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">NFT Marketplace</h1>
        <Categories />

        <div className="mt-8">
          <ListedNfts program={program} viewDetails={viewDetails} />
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo />
          <p className="text-gray-500 text-sm">© 2025 CryptoGamers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
