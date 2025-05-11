import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, X, Heart, Award, Cpu, Disc } from 'lucide-react';
import './marketplace.css';

// Logo Component
const Logo = () => (
  <div className="flex items-center gap-2">
    <Cpu size={28} className="text-purple-500" />
    <span className="font-bold text-xl bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">CryptoGamers</span>
  </div>
);

// NFT Card Component
const NFTCard = ({ item }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 border border-gray-700">
      <div className="relative">
        <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setLiked(!liked)}
            className="bg-gray-900/70 p-2 rounded-full hover:bg-gray-800"
          >
            <Heart size={16} fill={liked ? "#ec4899" : "none"} className={liked ? "text-pink-500" : "text-gray-300"} />
          </button>
        </div>
        {item.rare && (
          <div className="absolute top-2 left-2 bg-purple-600 text-xs py-1 px-2 rounded-full text-white flex items-center gap-1">
            <Award size={12} /> Rare
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-2">
          <h3 className="font-bold text-white">{item.name}</h3>
          <span className="text-green-400 font-mono">{item.price} ETH</span>
        </div>

        <p className="text-gray-400 text-sm mb-3">{item.description}</p>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">By {item.creator}</span>
          <button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category }) => (
  <div className="relative group cursor-pointer">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-blue-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-lg">{category.name}</span>
    </div>
    <img
      src={category.image}
      alt={category.name}
      className="h-40 w-full object-cover rounded-lg"
    />
  </div>
);

// Featured Collection Component
const FeaturedCollection = ({ collection }) => (
  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
    <div className="flex items-center gap-3 mb-4">
      <img src={collection.creatorAvatar} alt={collection.creator} className="w-10 h-10 rounded-full border-2 border-purple-500" />
      <div>
        <h3 className="font-bold text-white">{collection.name}</h3>
        <p className="text-sm text-gray-400">by {collection.creator}</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4">
      {collection.preview.map((img, idx) => (
        <img key={idx} src={img} alt="preview" className="w-full h-24 object-cover rounded-md" />
      ))}
    </div>

    <div className="flex justify-between items-center">
      <span className="text-purple-400 text-sm">{collection.items} items</span>
      <button className="text-white text-sm border border-purple-500 hover:bg-purple-500/20 px-3 py-1 rounded-full transition-all">
        View All
      </button>
    </div>
  </div>
);

// Main App
export default function NFTMarketplace() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sample NFT data
  const nftItems = [
    {
      id: 1,
      name: "Neon Rider Skateboard",
      description: "Limited edition cyberpunk skateboard skin with reactive LED effects",
      price: 0.85,
      image: "/api/placeholder/400/320",
      creator: "CyberSkater",
      rare: true
    },
    {
      id: 2,
      name: "Golden Dragon AWP",
      description: "Legendary weapon skin with animated gold dragon design",
      price: 1.25,
      image: "/api/placeholder/400/320",
      creator: "SkinMaster"
    },
    {
      id: 3,
      name: "Hoverboard Multiverse",
      description: "Cosmic hoverboard skin with star trail effects",
      price: 0.45,
      image: "/api/placeholder/400/320",
      creator: "DigitalRider"
    },
    {
      id: 4,
      name: "Cyber Samurai Armor",
      description: "Full armor set with neon accents and reactive damage displays",
      price: 2.1,
      image: "/api/placeholder/400/320",
      creator: "NeonForge",
      rare: true
    }
  ];

  // Sample categories
  const categories = [
    { name: "Weapon Skins", image: "/api/placeholder/400/320" },
    { name: "Skateboards", image: "/api/placeholder/400/320" },
    { name: "Character Skins", image: "/api/placeholder/400/320" },
    { name: "Vehicles", image: "/api/placeholder/400/320" }
  ];

  // Sample collections
  const collections = [
    {
      name: "CryptoSkate 2077",
      creator: "NeuroDesigns",
      creatorAvatar: "/api/placeholder/100/100",
      items: 42,
      preview: [
        "/api/placeholder/150/150",
        "/api/placeholder/150/150",
        "/api/placeholder/150/150"
      ]
    },
    {
      name: "Neon Arsenal",
      creator: "DigitalWeaponry",
      creatorAvatar: "/api/placeholder/100/100",
      items: 64,
      preview: [
        "/api/placeholder/150/150",
        "/api/placeholder/150/150",
        "/api/placeholder/150/150"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo />

              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-10 space-x-8">
                <a href="#" className="text-white font-medium">Home</a>
                <a href="#" className="text-purple-400 font-medium">Marketplace</a>
                <a href="#" className="text-gray-300 hover:text-white font-medium">Collections</a>
                <a href="#" className="text-gray-300 hover:text-white font-medium">Community</a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:flex items-center bg-gray-800 rounded-full px-3 py-1">
                <input
                  type="text"
                  placeholder="Search NFTs..."
                  className="bg-transparent border-none focus:outline-none text-sm w-40"
                />
                <Search size={16} className="text-gray-400" />
              </div>

              {/* Cart */}
              <button className="p-2 rounded-full hover:bg-gray-800">
                <ShoppingCart size={20} />
              </button>

              {/* Connect Wallet Button */}
              <button className="hidden md:block bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 px-4 py-2 rounded-full text-sm font-medium transition-all">
                Connect Wallet
              </button>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 rounded-md text-white font-medium">Home</a>
              <a href="#" className="block px-3 py-2 rounded-md bg-gray-800 text-purple-400 font-medium">Marketplace</a>
              <a href="#" className="block px-3 py-2 rounded-md text-gray-300 hover:text-white font-medium">Collections</a>
              <a href="#" className="block px-3 py-2 rounded-md text-gray-300 hover:text-white font-medium">Community</a>

              <div className="px-3 py-2">
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 px-4 py-2 rounded-full text-sm font-medium transition-all">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
              Gaming NFT Marketplace
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Buy, sell and collect unique digital gaming assets. From legendary weapon skins to
              exclusive skateboards - own a piece of gaming history.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all">
                <Disc size={20} />
                Explore NFTs
              </button>
              <button className="border border-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-500/20 transition-all">
                Create NFT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Categories */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Browse Categories</h2>
            <a href="#" className="text-purple-400 hover:text-purple-300">View All</a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, idx) => (
              <CategoryCard key={idx} category={category} />
            ))}
          </div>
        </div>

        {/* Featured NFTs */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Hot NFTs 🔥</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full text-sm bg-purple-600 text-white">All</button>
              <button className="px-3 py-1 rounded-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300">Weapon Skins</button>
              <button className="px-3 py-1 rounded-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300">Skateboards</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nftItems.map(item => (
              <NFTCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Featured Collections */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Top Collections</h2>
            <a href="#" className="text-purple-400 hover:text-purple-300">View All</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collections.map((collection, idx) => (
              <FeaturedCollection key={idx} collection={collection} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo />
              <p className="mt-4 text-gray-400 text-sm">
                The premier NFT marketplace for gamers and collectors. Buy, sell, and trade unique digital assets.
              </p>
              <div className="flex gap-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-purple-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Marketplace</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400">All NFTs</a></li>
                <li><a href="#" className="hover:text-purple-400">Weapon Skins</a></li>
                <li><a href="#" className="hover:text-purple-400">Skateboards</a></li>
                <li><a href="#" className="hover:text-purple-400">Characters</a></li>
                <li><a href="#" className="hover:text-purple-400">Vehicles</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Account</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400">Profile</a></li>
                <li><a href="#" className="hover:text-purple-400">My Collections</a></li>
                <li><a href="#" className="hover:text-purple-400">Favorites</a></li>
                <li><a href="#" className="hover:text-purple-400">Settings</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Subscribe</h3>
              <p className="text-gray-400 text-sm mb-4">Get the latest drops and updates</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-gray-800 border border-gray-700 rounded-l-md px-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">© 2025 CryptoGamers. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm">Help Center</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}