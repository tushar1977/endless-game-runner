import { PublicKey } from "@solana/web3.js";

const mintHighScoreNFT = async ({ publicKey, connection }) => {
  if (!publicKey || !profile || !program) {
    alert("Wallet not connected or profile not found or program not initialized");
    return;
  }

  setNftLoading(true);
  setError(null);

  try {
    const highScore = profile.highScore || 0;
    const name = `Surf HighScore`;
    const symbol = "SURF";
    const uri = "https://bronze-circular-anteater-873.mypinata.cloud/ipfs/bafkreicqxfgqgujfk3selkf64v4llacajnkgdleh3eyjxpl2tz4gvcp2hy";
    const mint = Keypair.generate();
    const [playerPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("player"), publicKey.toBuffer()],
      PROGRAM_ID
    );
    const [walletPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("wallet"), publicKey.toBuffer()],
      PROGRAM_ID
    );
    const [nftPDA] = PublicKey.findProgramAddressSync([Buffer.from("nft_authority")], PROGRAM_ID)
    const destinationTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const metadataVec = [
      { key: "bg", value: "ff" },
      { key: "fgg", value: "ff" },
      { key: "speed", value: "fast" },
    ];
    const ix = await program.methods
      .mintNft(uri, name, symbol, false, null, metadataVec)
      .accounts({
        signer: publicKey,
        player: playerPDA,
        tokenAccount: destinationTokenAccount,
        nftAuthority: nftPDA,
        wallet: walletPDA,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = publicKey;
    tx.partialSign(mint);

    const signed = await signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txid, 'confirmed');

    setNftSignature(txid);
    setNftMinted(true);
    alert(`✅ NFT Minted! TX: ${txid}`);

  } catch (err) {
    console.error("❌ NFT Minting Error:", err);
    setError(err.message);
    alert(`Minting failed: ${err.message}`);
  } finally {
    setNftLoading(false);
  }
};

const updateHighScoreNft = async () => {
  if (!publicKey || !signTransaction || !profile || !profile.highscoreNftMint || !program) {
    alert("Wallet not connected or profile not found or NFT mint not found or program not initialized");
    return;
  }

  setNftLoading(true);
  setError(null);

  try {
    const highScore = new anchor.BN(222);
    const mintPublicKey = new PublicKey(profile.highscoreNftMint);
    const [playerPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("player"), publicKey.toBuffer()],
      PROGRAM_ID
    );
    const [nftPDA] = PublicKey.findProgramAddressSync([Buffer.from("nft_authority")], PROGRAM_ID);
    const ix = await program.methods
      .updateNft(highScore)
      .accounts({
        signer: publicKey,
        player: playerPDA,
        nftAuthority: nftPDA,
        mint: mintPublicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = publicKey;

    const signed = await signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txid, 'confirmed');

    setNftSignature(txid);
    alert(`✅ NFT updated! TX: ${txid}`);

  } catch (err) {
    console.error("❌ Error updating NFT:", err);
    setError(err.message);
    alert(`Updating failed: ${err.message}`);
  } finally {
    setNftLoading(false);
  }
};
