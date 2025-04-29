import * as anchor from "@coral-xyz/anchor";
import { SendTransactionError } from '@solana/web3.js'; // you may need this if not imported yet
import { Program } from "@coral-xyz/anchor";
import { Surf } from "../target/types/surf";
import {
  PublicKey,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import BN from "bn.js";

describe("surf", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Surf as Program<Surf>;
  const name = "Bearer"
  const symbol = "BE"
  const generatePDA = (label: string, suffix?: string): [PublicKey, number] => {
    const seeds = [Buffer.from(label), provider.wallet.publicKey.toBuffer()];
    if (suffix) seeds.push(Buffer.from(suffix));
    return PublicKey.findProgramAddressSync(seeds, program.programId);
  };

  const [playerPDA] = generatePDA("player");
  const [walletPDA] = generatePDA("wallet");
  const [marketplacePDA] = generatePDA("marketplace");
  const [escrowPDA] = generatePDA("escrow")
  const [listingPDA] = generatePDA("listing")

  console.log(`player pda ${playerPDA}`)
  console.log(`wallet pda ${walletPDA}`)
  console.log(`marketplace pda ${marketplacePDA}`)

  console.log(escrowPDA)
  console.log(listingPDA)
  it("Initializes player account", async () => {
    await program.methods
      .initPlayer()
      .accounts({
        playerAccount: playerPDA,
        wallet: walletPDA,
        signer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const player = await program.account.playerProfile.fetch(playerPDA);
    console.log(player)
  });

  it("Updates player with score and coins", async () => {
    const score = new BN(1500);
    const coins = new BN(1200);

    await program.methods
      .updatePlayer(score, coins)
      .accounts({
        player: playerPDA,
        signer: provider.wallet.publicKey,
        wallet: walletPDA,
      })
      .rpc();

    const player = await program.account.playerProfile.fetch(playerPDA);
    console.log(player)
  });

  it("Fails to update with wrong wallet PDA", async () => {
    const [wrongWalletPDA] = generatePDA("wallet", "wrong");

    try {
      await program.methods
        .updatePlayer(new BN(1000), new BN(500))
        .accounts({
          player: playerPDA,
          signer: provider.wallet.publicKey,
          wallet: wrongWalletPDA,
        })
        .rpc();
      assert.fail("Expected constraint violation error but transaction succeeded.");
    } catch (err: any) {
      console.log("Caught expected error:", err.error.errorMessage);
      assert.include(err.error.errorMessage, "A has one constraint was violated");
    }
  });

  it('Mint nft!', async () => {
    const mint = new Keypair();
    console.log('Mint public key', mint.publicKey.toBase58());
    const destinationTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const uri = "https://arweave.net/MHK3Iopy0GgvDoM7LkkiAdg7pQqExuuWvedApCnzfj0"
    getOrCreateAssociatedTokenAccount;
    const tx = await program.methods
      .mintNft(uri, name, symbol)
      .accounts({
        signer: provider.wallet.publicKey,
        tokenAccount: destinationTokenAccount,
        mint: mint.publicKey,
      })
      .signers([mint])
      .rpc();

    console.log('Mint nft tx', tx);
    await provider.connection.confirmTransaction(tx, 'confirmed');
  });
  it('Updates NFT with New High Score', async () => {
    const mint = new Keypair();
    console.log('Mint public key', mint.publicKey.toBase58());

    const destinationTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const uri = "https://arweave.net/MHK3Iopy0GgvDoM7LkkiAdg7pQqExuuWvedApCnzfj0";

    const tx = await program.methods
      .mintNft(uri, name, symbol)
      .accounts({
        signer: provider.wallet.publicKey,
        tokenAccount: destinationTokenAccount,
        mint: mint.publicKey,
      })
      .signers([mint])
      .rpc();

    console.log('Mint NFT transaction:', tx);
    await provider.connection.confirmTransaction(tx, 'confirmed');

    let player = await program.account.playerProfile.fetch(playerPDA);
    console.log("Player profile before update:", player);

    const newHighScore = new BN(2500);

    // Update the NFT
    const updateTx = await program.methods
      .updateNft(newHighScore)
      .accounts({
        signer: provider.wallet.publicKey,
        player: playerPDA,
        tokenAccount: destinationTokenAccount,
        mint: mint.publicKey,
        wallet: walletPDA,
        token_program: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    console.log('Update NFT transaction:', updateTx);
    await provider.connection.confirmTransaction(updateTx, 'confirmed');

    player = await program.account.playerProfile.fetch(playerPDA);
    console.log("Player profile after update:", player);

    assert.equal(player.highScore.toString(), newHighScore.toString(), "High score was not updated correctly");

    const nftMetadata = await provider.connection.getAccountInfo(mint.publicKey);
    console.log(nftMetadata)


  });
});
