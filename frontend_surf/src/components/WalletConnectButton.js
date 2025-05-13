import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export const WalletConnectButton = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleDisconnect = useCallback(async () => {
    try {
      setDropdownOpen(false);
      await disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [disconnect]);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        className="btn btn-outline-cyan btn-lg px-4 py-3"
        onClick={connected ? toggleDropdown : handleConnect}
      >
        <i className="fas fa-wallet me-2"></i>
        {connected ? `Wallet: ${shortAddress}` : 'Connect Wallet'}
      </button>

      {connected && dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
          <ul className="py-1 text-gray-700">
            <li>
              <button
                onClick={() => {
                  setVisible(true);
                  setDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Change Wallet
              </button>
            </li>
            <li>
              <button
                onClick={handleDisconnect}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Disconnect
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
