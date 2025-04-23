const fs = require('fs');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Program, AnchorProvider, web3, BN } = require('@project-serum/anchor');

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

const idl = require('../../surf/target/idl/surf.json');
const programId = new PublicKey('Ahyi5zC8KucSuDKY1BxRp9v1x61jEsuamTcR9cky8NYm');

const secretKeyPath = "/home/tushar/.config/solana/id.json";
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(secretKeyPath, 'utf8')));
const programWallet = Keypair.fromSecretKey(secretKey);

const provider = new AnchorProvider(
  connection,
  {
    publicKey: programWallet.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(programWallet);
      return tx;
    },
    signAllTransactions: async (txs) => {
      return txs.map((tx) => {
        tx.partialSign(programWallet);
        return tx;
      });
    },
  },
  { commitment: 'confirmed' }
);

const program = new Program(idl, programId, provider);
console.log(program)
