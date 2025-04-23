const { Keypair, SystemProgram, Connection, Transaction, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@project-serum/anchor');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../surf/target/idl/surf.json');
const idl = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const PROGRAM_ID = new PublicKey('Ahyi5zC8KucSuDKY1BxRp9v1x61jEsuamTcR9cky8NYm');
const RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

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

const fetchPlayerProfile = async (req, res) => {
  const { publicKey } = req.body;
  const walletPublicKey = new PublicKey(publicKey);
  const dummyWallet = new DummyWallet(walletPublicKey);

  const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
  const program = new Program(idl, PROGRAM_ID, provider);

  const [playerPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('player'), walletPublicKey.toBuffer()],
    PROGRAM_ID
  );

  try {
    const playerAccount = await program.account.playerProfile.fetch(playerPDA);
    return res.status(200).json(playerAccount);
  } catch (err) {
    console.error('Error fetching player profile:', err);
    return res.status(400).json({ message: 'Profile not found or error occurred', error: err.message });
  }
}

const initPlayer = async (req, res) => {
  const { signedTx } = req.body;

  if (!signedTx) {
    return res.status(400).json({ message: 'Signed transaction is required' });
  }

  try {
    // Deserialize the transaction
    const txBuffer = Buffer.from(signedTx, 'base64');
    const tx = Transaction.from(txBuffer);

    // Send the transaction to the network
    const signature = await connection.sendRawTransaction(tx.serialize());
    console.log('📝 Transaction sent with signature:', signature);

    // Confirm the transaction
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log('✅ Transaction confirmed!');

    return res.status(200).json({
      signature,
      message: 'Player initialized successfully'
    });
  } catch (err) {
    console.error('❌ Error processing transaction:', err);
    return res.status(500).json({
      message: 'Transaction failed',
      error: err.message
    });
  }
};
module.exports = {
  fetchPlayerProfile,
  initPlayer,
};
