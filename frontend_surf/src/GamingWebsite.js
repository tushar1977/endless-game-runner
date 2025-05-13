import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as THREE from 'three';
import './styles.css';
import { Link } from 'react-router-dom';
import NFTAdminPanel from './components/NFTAdminPanel';
import { TrendingUp, TrendingDown, Award, Users, BarChart2, Gamepad, Zap } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function GamingWebsite() {
  const [gamesData, setGamesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('24h');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('leaderboard');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const navbarRef = useRef(null);
  const canvasRef = useRef(null);

  const allNfts = [
    { id: 1, name: 'Dragon Sword', category: 'weapon', price: 120, rarity: 'Rare', image: '/images/sword.png' },
    { id: 2, name: 'Magic Cape', category: 'armor', price: 90, rarity: 'Epic', image: '/images/cape.png' },
    // Add more NFTs here...
  ];

  const filteredNfts = allNfts.filter(item =>
    marketplaceFilter === 'all' || item.category.toLowerCase() === marketplaceFilter
  );

  useEffect(() => {
    setTimeout(() => {
      const mockData = [
        { id: 1, name: 'Axie Infinity', symbol: 'AXS', playerCount: 284500, change24h: 8.43, change7d: 12.21, totalValue: 3250000000, dailyVolume: 42150000, rank: 1, category: 'Card Battle' },
        { id: 2, name: 'Decentraland', symbol: 'MANA', playerCount: 186400, change24h: 3.71, change7d: -2.62, totalValue: 1230000000, dailyVolume: 18720000, rank: 2, category: 'Metaverse' },
        { id: 3, name: 'The Sandbox', symbol: 'SAND', playerCount: 142530, change24h: -4.34, change7d: 8.41, totalValue: 890000000, dailyVolume: 12350000, rank: 3, category: 'Metaverse' },
        { id: 4, name: 'Gods Unchained', symbol: 'GODS', playerCount: 128940, change24h: 11.21, change7d: 18.73, totalValue: 560000000, dailyVolume: 9120000, rank: 4, category: 'Card Game' },
        { id: 5, name: 'Illuvium', symbol: 'ILV', playerCount: 82310, change24h: 5.45, change7d: -1.36, totalValue: 410000000, dailyVolume: 6890000, rank: 5, category: 'RPG' },
        { id: 6, name: 'Gala Games', symbol: 'GALA', playerCount: 65290, change24h: -2.18, change7d: -3.92, totalValue: 280000000, dailyVolume: 5210000, rank: 6, category: 'Ecosystem' },
      ];
      setGamesData(mockData);
      setIsLoading(false);
    }, 1500);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
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

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color("hsl(270, 95%, 75%)"), wireframe: true });
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    camera.position.z = 30;

    let hue = 0;
    const colorShift = new THREE.Color();

    const animate = () => {
      requestAnimationFrame(animate);
      torusKnot.rotation.x += 0.01;
      torusKnot.rotation.y += 0.01;
      hue = (hue + 0.001) % 1;
      colorShift.setHSL(hue, 0.8, 0.5);
      torusKnot.material.color = colorShift;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.remove(torusKnot);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else {
      return `$${num.toLocaleString()}`;
    }
  };

  const formatPlayers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toLocaleString();
    }
  };
  return (
    <div className="gaming-site">
      {/* Canvas for 3D background */}
      <canvas
        ref={canvasRef}
        className="background-canvas"
      />

      {/* Overlay with blur for depth */}
      <div className="overlay-blur"></div>

      {/* Content container */}
      <div className="content-container">
        {/* Navigation Bar */}
        <nav ref={navbarRef} className="navbar navbar-expand-lg fixed-top navbar-dark bg-transparent">
          <div className="container">
            {/* Logo */}
            <a className="navbar-brand logo-text" href="#">
              <i className="fas fa-gamepad me-2"></i>
              NEXUS
            </a>

            {/* Mobile toggle button */}
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
                  <a className="nav-link px-3" href="#">About</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link px-3" href="#">Play</a>
                </li>
                <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                  <a className="btn btn-sign-in px-4 py-2" href="/nft">
                    Admin
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section py-5">
          <div className="container py-5">
            <div className="row justify-content-center text-center">
              <div className="col-lg-8">
                <h1 className="display-4 fw-bold mb-4 gradient-text">
                  Enter the New Era of Gaming
                </h1>
                <p className="lead text-light-blue mb-5">
                  Immerse yourself in breathtaking worlds with cutting-edge technology and unmatched gameplay experiences.
                </p>
                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                  <button className="btn btn-outline-cyan btn-lg px-4 py-3">
                    <WalletMultiButton />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Game Highlight */}
        <section className="featured-game-highlight py-5">
          <div className="container py-5">
            <div className="row align-items-center justify-content-center">

              {/* Game Visual */}
              <div className="col-md-6 mb-4 mb-md-0 d-flex justify-content-center">
                <div className="highlighted-game-image-wrapper position-relative overflow-hidden rounded-4">
                  <div className="highlighted-game-image-background position-absolute w-100 h-100 top-0 left-0 bg-gradient"></div>
                  <img
                    src="" //image 
                    alt="Game Highlight"
                    className="img-fluid glowing-border position-relative z-index-2"
                  />
                </div>
              </div>

              {/* Game Description */}
              <div className="col-md-6 text-light">
                <h5 className="text-uppercase neon-green mb-3">Now Live</h5>
                <h2 className="display-4 fw-bold gradient-text mb-4">
                  Battle. Conquer. Rule.
                </h2>
                <p className="lead text-light-blue mb-4">
                  Dive into the ultimate open-world multiplayer battle arena. Powered by blockchain for limitless freedom, zero lag, and real ownership. Gear up and dominate the battlefield!
                </p>
                <button className="btn btn-neon w-auto px-4 py-2">
                  Play Game →
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
      {/* leaderboard */}

      <div className="crypto-games-container">
        {/* Header */}
        <div className="games-header">
          <div className="fw-bold gradient-text mb-0">
            {/* <Gamepad className="games-title-icon"  /> */}
            <h1>LeaderBoards</h1>
          </div>
          <div className="time-frame-selector">
            <button
              onClick={() => setTimeFrame('24h')}
              className={`time-frame-button ${timeFrame === '24h' ? 'active' : ''}`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeFrame('7d')}
              className={`time-frame-button ${timeFrame === '7d' ? 'active' : ''}`}
            >
              7d
            </button>
            <button
              onClick={() => setTimeFrame('30d')}
              className={`time-frame-button ${timeFrame === '30d' ? 'active' : ''}`}
            >
              30d
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards-grid">
          <div className="stats-card">
            <div className="stats-card-header">
              <h3 className="stats-card-title">Total Players</h3>
              <Users className="stats-card-icon" size={20} />
            </div>
            <p className="stats-card-value">890.5K</p>
            <div className="stats-card-trend trend-up">
              <TrendingUp size={16} className="trend-icon" />
              <span>+5.4%</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <h3 className="stats-card-title">NFT Trading Volume</h3>
              <Award className="stats-card-icon" size={20} />
            </div>
            <p className="stats-card-value">$94.3M</p>
            <div className="stats-card-trend trend-up">
              <TrendingUp size={16} className="trend-icon" />
              <span>+12.8%</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <h3 className="stats-card-title">Earning Potential</h3>
              <Zap className="stats-card-icon" size={20} />
            </div>
            <p className="stats-card-value">$248/day</p>
            <div className="stats-card-trend trend-down">
              <TrendingDown size={16} className="trend-icon" />
              <span>-2.3%</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="games-table-container">
          <div className="games-table-wrapper">
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              <table className="games-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Game</th>
                    <th>Category</th>
                    <th>Players</th>
                    <th>
                      {timeFrame === '24h' ? '24h' : timeFrame === '7d' ? '7d' : '30d'}
                    </th>
                    <th>Total Value</th>
                    <th>Daily Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {gamesData.map((game) => (
                    <tr key={game.id}>
                      <td className="game-rank">{game.rank}</td>
                      <td>
                        <div className="game-info">
                          <div className="game-icon">
                            <span>{game.symbol.substring(0, 1)}</span>
                          </div>
                          <div className="game-details">
                            <p className="game-name">{game.name}</p>
                            <p className="game-symbol">{game.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="game-category">
                          {game.category}
                        </span>
                      </td>
                      <td className="game-players">{formatPlayers(game.playerCount)}</td>
                      <td className={timeFrame === '24h'
                        ? (game.change24h > 0 ? 'change-positive' : 'change-negative')
                        : (game.change7d > 0 ? 'change-positive' : 'change-negative')}>
                        <div>
                          {timeFrame === '24h' ? (
                            game.change24h > 0 ? <TrendingUp size={14} className="trend-icon" /> : <TrendingDown size={14} className="trend-icon" />
                          ) : (
                            game.change7d > 0 ? <TrendingUp size={14} className="trend-icon" /> : <TrendingDown size={14} className="trend-icon" />
                          )}
                          {timeFrame === '24h' ? `${game.change24h > 0 ? '+' : ''}${game.change24h}%` : `${game.change7d > 0 ? '+' : ''}${game.change7d}%`}
                        </div>
                      </td>
                      <td className="game-value">{formatNumber(game.totalValue)}</td>
                      <td className="game-volume">{formatNumber(game.dailyVolume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>

        </div>
        <div className="text-center mt-5">
          <a href="/" className="nav-link">
            <button className="btn btn-gradient-purple btn-lg px-4 py-3">
              View All
            </button>
          </a>
        </div>



        {/* NFT Marketplace Section */}

        <section className="nft-marketplace py-5">
          <div className="container py-3">
            <div className="d-flex justify-content-between align-items-center mb-5">
              <h2 className="fw-bold gradient-text mb-0">NFT Marketplace</h2>
              <div className="sol-balance-display">
                <i className="fas fa-sun me-1"></i> 245.8 SOL
              </div>
            </div>

            <div className="mb-4">
              <div className="btn-group" role="group">
                <button
                  className={`btn ${marketplaceFilter === 'all' ? 'btn-gradient-purple' : 'btn-outline-purple'}`}
                  onClick={() => setMarketplaceFilter('all')}>
                  All Items
                </button>
                <button
                  className={`btn ${marketplaceFilter === 'weapon' ? 'btn-gradient-cyan' : 'btn-outline-cyan'}`}
                  onClick={() => setMarketplaceFilter('weapon')}>
                  Weapons
                </button>
                <button
                  className={`btn ${marketplaceFilter === 'accessory' ? 'btn-gradient-fuchsia' : 'btn-outline-fuchsia'}`}
                  onClick={() => setMarketplaceFilter('accessory')}>
                  Accessories
                </button>
                <button
                  className={`btn ${marketplaceFilter === 'armor' ? 'btn-gradient' : 'btn-outline-light'}`}
                  onClick={() => setMarketplaceFilter('armor')}>
                  Armor
                </button>
              </div>
            </div>

            <div className="row g-4">
              {filteredNfts.map(item => (
                <div className="col-md-6 col-lg-3" key={item.id}>
                  <div className="card nft-card h-100">
                    <div className="nft-image-container">
                      <img src={item.image} className="card-img-top" alt={item.name} />
                      <span className={`rarity-badge rarity-${item.rarity.toLowerCase()}`}>
                        {item.rarity}
                      </span>
                    </div>
                    <div className="card-body">
                      <h4 className="card-title">{item.name}</h4>
                      <p className="nft-category">{item.category}</p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className="sol-price">
                          <i className="fas fa-sun me-1"></i> {item.price} SOL
                        </span>
                        <button className="btn btn-sm btn-outline-cyan">
                          <i className="fas fa-shopping-cart me-1"></i> Buy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-5">
              <a href="/marketplace" className="nav-link">
                <button className="btn btn-gradient-purple btn-lg px-4 py-3">
                  View All NFTs
                </button>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section py-5">
          <div className="container py-3">
            <div className="cta-card p-4 p-md-5 text-center">
              <h2 className="display-6 fw-bold mb-3">Ready to Start Your Gaming Adventure?</h2>
              <p className="lead mb-4 mx-auto text-light-blue" style={{ maxWidth: '700px' }}>
                Join our community of gamers and experience the next generation of blockchain gaming with Solana. Earn while you play!
              </p>
              <div className="d-flex justify-content-center gap-3">
                <WalletMultiButton />

              </div>
            </div>
          </div>
        </section>



        {/* Footer */}
        <footer className="footer py-4">
          <div className="container">
            <div className="row align-items-center mb-4">
              <div className="col-md-6 mb-4 mb-md-0 text-center text-md-start">
                <a className="navbar-brand logo-text" href="#">
                  <i className="fas fa-gamepad me-2"></i>
                  NEXUS
                </a>
              </div>
              <div className="col-md-6">
                <ul className="nav justify-content-center justify-content-md-end">
                  <li className="nav-item">
                    <a className="nav-link text-light-blue" href="#">About</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link text-light-blue" href="#">Games</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link text-light-blue" href="#">Support</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link text-light-blue" href="#">Contact</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-top border-dark-blue pt-4 text-center">
              <p className="text-light-blue">© 2025 NEXUS Gaming. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GamingWebsite;
