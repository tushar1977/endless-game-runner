import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GamingWebsite from './GamingWebsite';
import NFTAdminPanel from './components/NFTAdminPanel';
import Marketplace from './Marketplace';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GamingWebsite />} />
        <Route path="/nft" element={<NFTAdminPanel />} />
        <Route path="/marketplace" element={<Marketplace />} />



      </Routes>
    </Router>
  );
};

export default App;
