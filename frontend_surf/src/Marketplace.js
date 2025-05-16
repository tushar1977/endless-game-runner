import React, { useState, useEffect, useRef } from 'react';

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
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navbarRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      if (navbarRef.current) {
        if (window.scrollY > 50) {
          navbarRef.current.classList.add('navbar-glass');
        } else {
          navbarRef.current.classList.remove('navbar-glass');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav ref={navbarRef} className="navbar navbar-expand-lg fixed-top navbar-dark bg-transparent">
      <div className="container">
        {/* Logo */}
        <a className="navbar-brand logo-text" href="#">
          <img src="/logo.png" alt="NEXUS Logo" style={{ height: '65px' }} />
          <i className="fas fa-gamepad me-2"></i>
          Zypher<i>X</i>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen ? "true" : "false"}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation items */}
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            <li className="nav-item">
              <a className="nav-link px-3" href="#">Home</a>
            </li>
            <li className="nav-item">
              <a className="nav-link px-3" href="/game">Play</a>
            </li>
            <li className="nav-item">
              <a className="nav-link px-3" href="/Marketplace">Market </a>
            </li>
            <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
              <a className="btn btn-sign-in px-4 py-2" href="/nft">
                Connect Wallet
              </a>
            </li>
          </ul>
        </div>
      </div>
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
    <div style={{ paddingTop: '70px' }}
      className="min-h-screen bg-gray-900 text-white">
      <Navbar />


      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">NFT Marketplace</h1>
        <Categories />

        <div className="mt-8">
          <ListedNfts program={program} viewDetails={viewDetails} />
        </div>
      </main>
    </div>
  );
}
