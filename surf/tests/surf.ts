import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Surf } from "../target/types/surf";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Connection,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getTokenMetadata,
} from "@solana/spl-token";
import { assert } from "chai";
import BN from "bn.js";


describe("surf", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Surf as Program<Surf>;
  const name = "Bearer";
  const symbol = "BE";
  const uri = "https://bronze-circular-anteater-873.mypinata.cloud/ipfs/bafkreicqxfgqgujfk3selkf64v4llacajnkgdleh3eyjxpl2tz4gvcp2hy";

  const generatePDA = (
    label: string,
    seed?: PublicKey,
    suffix?: string,
  ): [PublicKey, number] => {
    const seeds = [Buffer.from(label)];
    if (seed) seeds.push(seed.toBuffer());
    if (suffix) seeds.push(Buffer.from(suffix));
    return PublicKey.findProgramAddressSync(seeds, program.programId);
  };

  const buyer = Keypair.generate();
  let buyerProfile: PublicKey;
  let buyerWallet: PublicKey;
  const [playerPDA] = generatePDA("player", provider.wallet.publicKey);
  const [walletPDA] = generatePDA("wallet", provider.wallet.publicKey);
  const [nftPDA] = generatePDA("nft_authority");
  console.log(nftPDA)

  console.log(`player pda ${playerPDA}`);
  console.log(`wallet pda ${walletPDA}`);

  before(async () => {

    const airdropSignature = await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    [buyerProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("player"), buyer.publicKey.toBuffer()],
      program.programId
    );

    [buyerWallet] = PublicKey.findProgramAddressSync(
      [Buffer.from("wallet"), buyer.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initPlayer()
      .accounts({
        playerAccount: buyerProfile,
        wallet: buyerWallet,
        signer: buyer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    console.log(`Buyer account initialized: ${buyerProfile.toBase58()}`);

  })

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
    assert.ok(player);
    assert.equal(player.wallet.toBase58(), walletPDA.toBase58(), "Wallet PDA should match");
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
    assert.equal(player.highScore.toNumber(), score.toNumber(), "Score should be updated");
    assert.equal(player.totalCoins.toNumber(), coins.toNumber(), "Coins should be updated");
  });
  it("Fails to update with wrong wallet PDA", async () => {
    const [wrongWalletPDA] = generatePDA("wallet", provider.wallet.publicKey, "wrong");

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

  it('Mint High score nft!', async () => {
    const mint = new Keypair();
    console.log('Mint public key', mint.publicKey.toBase58());
    const destinationTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    getOrCreateAssociatedTokenAccount;
    console.log(`dest token acc ${destinationTokenAccount}`)
    const tx = await program.methods
      .mintNft(uri, name, symbol, true, new BN(2222), null)
      .accounts({
        signer: provider.wallet.publicKey,
        player: playerPDA,
        wallet: walletPDA,
        tokenAccount: destinationTokenAccount,
        nftAuthority: nftPDA,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    console.log("NFT minted in transaction:", tx);
    await provider.connection.confirmTransaction(tx, 'confirmed');

    const tokenAccountInfo = await getAccount(
      provider.connection,
      destinationTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.strictEqual(tokenAccountInfo.amount.toString(), '1', 'Token account should hold 1 NFT');
    assert.ok(tokenAccountInfo.owner.equals(provider.wallet.publicKey), 'Token account owner mismatch');
    assert.ok(tokenAccountInfo.mint.equals(mint.publicKey), 'Token account mint mismatch');
    const metadata = await getTokenMetadata(provider.connection, mint.publicKey)
    console.log(metadata)
  });

  it('Mint Skin nft!', async () => {
    const mint = new Keypair();
    console.log('Mint public key', mint.publicKey.toBase58());
    const destinationTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const metadataVec = [
      { key: "bg", value: "ff" },
      { key: "fgg", value: "ff" },
      { key: "speed", value: "fast" },
    ];
    getOrCreateAssociatedTokenAccount;
    console.log(`dest token acc ${destinationTokenAccount}`)
    const tx = await program.methods
      .mintNft(uri, name, symbol, false, null, metadataVec)
      .accounts({
        signer: provider.wallet.publicKey,
        player: playerPDA,
        wallet: walletPDA,
        tokenAccount: destinationTokenAccount,
        nftAuthority: nftPDA,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    console.log("NFT minted in transaction:", tx);
    await provider.connection.confirmTransaction(tx, 'confirmed');

    const tokenAccountInfo = await getAccount(
      provider.connection,
      destinationTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.strictEqual(tokenAccountInfo.amount.toString(), '1', 'Token account should hold 1 NFT');
    assert.ok(tokenAccountInfo.owner.equals(provider.wallet.publicKey), 'Token account owner mismatch');
    assert.ok(tokenAccountInfo.mint.equals(mint.publicKey), 'Token account mint mismatch');
    const metadata = await getTokenMetadata(provider.connection, mint.publicKey)
    console.log(metadata)
  });
  it('Updates NFT with New High Score', async () => {
    const mint = new Keypair();

    const destinationTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );


    const tx = await program.methods
      .mintNft(uri, name, symbol, true, new BN(2400), null)
      .accounts({
        signer: provider.wallet.publicKey,
        player: playerPDA,
        tokenAccount: destinationTokenAccount,
        nftAuthority: nftPDA,
        wallet: walletPDA,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    await provider.connection.confirmTransaction(tx, 'confirmed');
    const newHighScore = new BN(2500);

    await program.methods
      .updateNft(newHighScore)
      .accounts({
        signer: provider.wallet.publicKey,
        player: playerPDA,
        nftAuthority: nftPDA,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    console.log("Done")

    const metadata = await getTokenMetadata(provider.connection, mint.publicKey)
    console.log(metadata)
  });


  it('List NFT for sale and buy it with detailed logging', async () => {
    console.log("\n=== NFT Marketplace Flow ===");
    const lamportsToSol = (lamports: number) => {
      return lamports / LAMPORTS_PER_SOL;
    };

    // Step 1: Mint a new NFT
    console.log("\n--- Step 1: Minting NFT ---");
    const mint = new Keypair();
    console.log('Mint public key:', mint.publicKey.toBase58());

    const sellerTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log('Seller token account:', sellerTokenAccount.toBase58());

    const metadataVec = [
      { key: "bg", value: "ff" },
      { key: "fgg", value: "ff" },
      { key: "speed", value: "fast" },
    ];
    const mintTx = await program.methods
      .mintNft(uri, name, symbol, false, null, metadataVec)
      .accounts({
        signer: provider.wallet.publicKey,
        player: playerPDA,
        tokenAccount: sellerTokenAccount,
        nftAuthority: nftPDA,
        wallet: walletPDA,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    console.log('Mint transaction:', mintTx);
    await provider.connection.confirmTransaction(mintTx, 'confirmed');

    // Verify mint
    const sellerTokenAccountInfo = await getAccount(
      provider.connection,
      sellerTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('Seller token account info:', {
      amount: sellerTokenAccountInfo.amount.toString(),
      owner: sellerTokenAccountInfo.owner.toBase58(),
      mint: sellerTokenAccountInfo.mint.toBase58()
    });
    assert.equal(sellerTokenAccountInfo.amount.toString(), "1", "Seller should have 1 token initially");

    let player = await program.account.playerProfile.fetch(playerPDA);
    console.log("Player skined owned", player.skinsOwned)
    console.log(player)
    const mintPublicKey = new PublicKey(player.skinsOwned[1]);
    // Step 2: List NFT for sale
    console.log("\n--- Step 2: Listing NFT for sale ---");
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), provider.wallet.publicKey.toBuffer(), mintPublicKey.toBuffer()],
      program.programId
    );
    console.log('Escrow PDA:', escrowPDA.toBase58());
    console.log('Mint pub', mintPublicKey)
    const escrowTokenAccount = getAssociatedTokenAddressSync(
      mintPublicKey,
      escrowPDA,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log('Escrow token account:', escrowTokenAccount.toBase58());

    const price = new anchor.BN(1_000_000_000); // 1 SOL
    console.log(`Listing NFT for price: ${price.toString()} lamports (${price.div(new BN(1_000_000_000)).toString()} SOL)`);
    console.log(mintPublicKey.toJSON())
    // List NFT
    const listTx = await program.methods
      .listNft(price)
      .accounts({
        signer: provider.wallet.publicKey,
        player: playerPDA,
        wallet: walletPDA,
        skinToList: mintPublicKey,
        skinToListTokenAccount: sellerTokenAccount,
        escrow: escrowPDA,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('List NFT transaction:', listTx);

    // Verify listing
    const esccroww = await program.account.escrow.fetch(escrowPDA);
    assert.ok(esccroww.isClosed == false)
    const escrowAccountInfo = await getAccount(
      provider.connection,
      escrowTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('Escrow token account info:', {
      amount: escrowAccountInfo.amount.toString(),
      owner: escrowAccountInfo.owner.toBase58(),
      mint: escrowAccountInfo.mint.toBase58(),
    });

    assert.ok(escrowAccountInfo.amount === BigInt(1), 'Escrow account should hold exactly 1 token');
    assert.ok(escrowAccountInfo.owner.equals(escrowPDA), 'Escrow account owner mismatch');
    assert.ok(escrowAccountInfo.mint.equals(mint.publicKey), 'Escrow account mint mismatch');
    console.log("✓ NFT listed successfully");
    player = await program.account.playerProfile.fetch(playerPDA)
    console.log(player)
    // Check seller's token account after listing
    const sellerTokenAccountAfterListing = await getAccount(
      provider.connection,
      sellerTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('Seller token account after listing:', {
      amount: sellerTokenAccountAfterListing.amount.toString()
    });
    assert.equal(sellerTokenAccountAfterListing.amount.toString(), "0", "Seller should have 0 tokens after listing");

    // Step 3: Buy NFT
    console.log("\n--- Step 3: Buying NFT ---");
    const buyerTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      buyer.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      mint.publicKey,
      buyer.publicKey,
      true,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log("Buyer pub key", buyer.publicKey.toBase58())
    console.log('Buyer token account:', buyerTokenAccount.toBase58());
    const buyerTokenAccountBefore = await getAccount(
      provider.connection,
      buyerTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('Buyer token account before purchase:', {
      amount: buyerTokenAccountBefore.amount.toString()
    });

    const sellerBalanceBefore = await provider.connection.getBalance(provider.wallet.publicKey);
    const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);
    console.log('Seller balance before:',
      `${sellerBalanceBefore} lamports (${lamportsToSol(sellerBalanceBefore)} SOL)`);
    console.log('Buyer balance before:',
      `${buyerBalanceBefore} lamports (${lamportsToSol(buyerBalanceBefore)} SOL)`);

    // Execute buy transaction
    const buyTx = await program.methods
      .buyNft()
      .accounts({
        buyer: buyer.publicKey,
        seller: provider.wallet.publicKey,
        player: buyerProfile,
        wallet: buyerWallet,
        nftMint: mint.publicKey,
        buyerTokenAccount: buyerTokenAccount,
        escrow: escrowPDA,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log('Buy NFT transaction:', buyTx);

    // Verify purchase
    const buyerTokenAccountAfter = await getAccount(
      provider.connection,
      buyerTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('Buyer token account after purchase:', {
      amount: buyerTokenAccountAfter.amount.toString(),
      owner: buyerTokenAccountAfter.owner.toBase58(),
      mint: buyerTokenAccountAfter.mint.toBase58()
    });

    const sellerBalanceAfter = await provider.connection.getBalance(provider.wallet.publicKey);
    const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
    console.log('Seller balance after:',
      `${sellerBalanceAfter} lamports (${lamportsToSol(sellerBalanceAfter)} SOL)`);
    console.log('Buyer balance after:',
      `${buyerBalanceAfter} lamports (${lamportsToSol(buyerBalanceAfter)} SOL)`);

    const sellerBalanceChange = lamportsToSol(sellerBalanceAfter - sellerBalanceBefore);
    const buyerBalanceChange = lamportsToSol(buyerBalanceBefore - buyerBalanceAfter);
    console.log('Seller balance change:', `${sellerBalanceChange} SOL`);
    console.log('Buyer balance change:', `${buyerBalanceChange} SOL`);
    try {
      await program.account.escrow.fetch(escrowPDA);
      assert.fail('Escrow account should be closed');
    } catch (error) {
      console.log('✓ Escrow account properly closed (lamports sent to seller)');
    }
    try {
      await getAccount(
        provider.connection,
        escrowTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      assert.fail('Escrow token account should be closed');
    } catch (error) {
      console.log('✓ Escrow token account properly closed');
    }
    assert.ok(buyerTokenAccountAfter.amount === BigInt(1), 'Buyer should receive exactly 1 token');
    assert.ok(buyerTokenAccountAfter.owner.equals(buyer.publicKey), 'Buyer token account owner mismatch');
    assert.approximately(sellerBalanceChange, 1, 0.01, 'Seller should receive approximately 1 SOL');
    assert.approximately(buyerBalanceChange, 1, 0.01, 'Buyer should spend approximately 1 SOL');

    console.log("✓ NFT purchase completed successfully");
  });
})
