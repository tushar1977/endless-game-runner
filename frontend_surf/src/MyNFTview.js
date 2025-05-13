import React from 'react';
import MyNFTs from './components/myNft';

const MyNFTsView = ({ program, connection }) => {
  return (
    <div className="bg-gray-900 min-h-screen text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">My NFTs & Listing</h2>
        <MyNFTs program={program} connection={connection} />
      </div>
    </div>
  );
};

export default MyNFTsView;
