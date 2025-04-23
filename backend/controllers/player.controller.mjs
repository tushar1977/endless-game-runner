import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@project-serum/anchor';
import fs from 'fs';
const idl = JSON.parse(fs.readFileSync(new URL('../../surf/target/idl/surf.json', import.meta.url)));

// Replace this with any valid public key for testing
const TEST_WALLET_PUBLIC_KEY = new PublicKey('6HBCaGxtQuK6QJwzW5R7T7VccWv8AfzMVAHxmuRa62sK');
const PROGRAM_ID = new PublicKey('Ahyi5zC8KucSuDKY1BxRp9v1x61jEsuamTcR9cky8NYm');
const RPC_URL = 'https://api.devnet.solana.com';

class DummyWallet {
  constructor(publicKey) {
    this.publicKey = publicKey;
  }
  signTransaction(tx) {
    return Promise.resolve(tx);
  }
  signAllTransactions(txs) {
    return Promise.resolve(txs);
  }
}

export async function fetchPlayerProfile() {
  const connection = new Connection(RPC_URL, 'confirmed');

  const dummyWallet = new DummyWallet(TEST_WALLET_PUBLIC_KEY);

  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
  });

  const program = new Program(idl, PROGRAM_ID, provider);

  const [playerPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('player'), TEST_WALLET_PUBLIC_KEY.toBuffer()],
    PROGRAM_ID
  );

  try {
    const playerAccount = await program.account.playerProfile.fetch(playerPDA);
    console.log('🎮 Player profile:', playerAccount);
    return playerAccount;
  } catch (err) {
    console.warn('No profile found, maybe not initialized yet.', err);
    return null;
  }
}
fetchPlayerProfile()
