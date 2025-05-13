import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useProgram } from './hooks/useProgram';

import GamingWebsite from './GamingWebsite';
import NFTAdminPanel from './components/NFTAdminPanel';
import Marketplace from './Marketplace';
import PlayerProfile from './Profile';
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';
import { Connection } from '@solana/web3.js';
import MyNFTsView from './MyNFTview';
import DevnetFaucet from './components/DevnetFaucet';
const connection = new Connection(process.env.REACT_APP_RPC, 'confirmed');
const App = () => {
  const program = useProgram();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<GamingWebsite />} />
        <Route path="/nft/:mintAddress" element={<NFTAdminPanel program={program} connection={connection} />} />
        <Route path="/marketplace" element={<Marketplace program={program} />} />
        <Route path="/profile" element={<PlayerProfile program={program} />} />
        <Route path="/list" element={<MyNFTsView program={program} connection={connection} />} />
        <Route path="/airdrop" element={<DevnetFaucet />} />
      </Routes>
    </Router>
  );
};

export default App;
