const { Keypair, SystemProgram, Connection, Transaction, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@project-serum/anchor');
const fs = require('fs');
const path = require('path');
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");

const filePath = path.resolve(__dirname, '../../surf/target/idl/surf.json');
const idl = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const PROGRAM_ID = new PublicKey('A9YHxLTPtT6YSCi793gNFMB4nUTByXhq9DzgKf169Zf');
const RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');
const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(Keypair.generate()));

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

const getNftImage = async (mintAddress) => {
  try {
    const mint = new PublicKey(mintAddress);
    console.log(mint)
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint });

    if (!nft.uri) throw new Error("No metadata URI found");

    const metadataRes = await fetch(nft.uri);
    const metadata = await metadataRes.json();

    return metadata.image || null;
  } catch (error) {
    console.error("Error fetching NFT metadata:", error.message);
    return null;
  }
};

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
    const bnToNumber = (bn) => bn.toNumber();
    return res.status(200).json({
      ...playerAccount,
      highScore: bnToNumber(playerAccount.highScore),
      totalCoins: bnToNumber(playerAccount.totalCoins),
      lastDailyClaim: bnToNumber(playerAccount.lastDailyClaim),
      lastGameTimestamp: bnToNumber(playerAccount.lastGameTimestamp)
    });
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

const mintNft = async (req, res) => {
  const { signedTx, name, symbol, uri } = req.body;

  if (!signedTx || !name || !symbol || !uri) {
    return res.status(400).json({ message: 'Missing required fields: signedTx, name, symbol, uri' });
  }

  try {
    const txBuffer = Buffer.from(signedTx, 'base64');
    const tx = Transaction.from(txBuffer);

    const signature = await connection.sendRawTransaction(tx.serialize());
    console.log('🎨 Minting NFT, tx hash:', signature);

    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return res.status(200).json({
      message: 'NFT minted successfully',
      signature
    });
  } catch (err) {
    console.error('❌ Error minting NFT:', err);
    return res.status(500).json({
      message: 'Failed to mint NFT',
      error: err.message
    });
  }
};
module.exports = {
  fetchPlayerProfile,
  initPlayer,
  mintNft
};
