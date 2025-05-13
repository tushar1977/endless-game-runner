import React from 'react';
import { WalletConnectButton } from './components/WalletConnectButton';
import MyNFTs from './components/myNft';

const MyNFTsView = ({ program, connection }) => {
  return (
    <div className="bg-gray-900 min-h-screen text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            <WalletConnectButton />
            My NFT Collection
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
            Manage and list your NFTs in our marketplace
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700/50">
          <div className="p-6 sm:p-8">
            <MyNFTs program={program} connection={connection} />
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  );
};

export default MyNFTsView;
