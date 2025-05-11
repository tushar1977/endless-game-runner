import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';
const IDL = require('../idl/surf.json')
const PROGRAM_ID = new anchor.web3.PublicKey('4pzvADeMCm62GziZvTfEMTeoYnraQJJmN5tAdqd6ARSM');
const RPC_URL = 'https://api.devnet.solana.com';

const useProgram = () => {
  const { publicKey, signTransaction } = useWallet();
  const connection = new Connection(RPC_URL, 'confirmed');

  const getProgram = () => {
    const walletAdapter = {
      publicKey,
      signTransaction,
      signAllTransactions: async (txs) => Promise.all(txs.map(tx => signTransaction(tx)))
    };
    const provider = new anchor.AnchorProvider(connection, walletAdapter, { commitment: 'confirmed' });
    return new anchor.Program(IDL, PROGRAM_ID, provider);
  };

  return getProgram();
};

export default useProgram;
