import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Surf } from "../target/types/surf";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import BN from "bn.js";

describe("surf", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Surf as Program<Surf>;
  anchor.setProvider(provider);

  const generatePDA = (label: string, suffix?: string): [PublicKey, number] => {
    const seeds = [Buffer.from(label), provider.wallet.publicKey.toBuffer()];
    if (suffix) seeds.push(Buffer.from(suffix));
    return PublicKey.findProgramAddressSync(seeds, program.programId);
  };

  const [playerPDA, _] = generatePDA("player");
  const [walletPDA, __] = generatePDA("wallet");

  console.log("Player PDA:", playerPDA.toBase58());
  console.log("Wallet PDA:", walletPDA.toBase58());

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

    const playerAccount = await program.account.playerProfile.fetch(playerPDA);
    console.log("Initialized Player Account:", playerAccount);
  });

  it("Updates player", async () => {
    let score = new BN(1500);
    let coins = new BN(1100);

    await program.methods
      .updatePlayer(score, coins)
      .accounts({
        player: playerPDA,
        signer: provider.wallet.publicKey,
        wallet: walletPDA,
      })
      .rpc();

    const playerAccount = await program.account.playerProfile.fetch(playerPDA);
    console.log("Updated High Score:", playerAccount.highScore.toString());
    console.log("Updated Total Coins:", playerAccount.totalCoins.toString());
  });

  it("Fails to update with wrong wallet PDA", async () => {
    const [wrongWalletPDA, ___] = generatePDA("wallet", "wrong");

    let score = new BN(1500);
    let coins = new BN(1100);

    try {
      await program.methods
        .updatePlayer(score, coins)
        .accounts({
          player: playerPDA,
          signer: provider.wallet.publicKey,
          wallet: wrongWalletPDA,
        })
        .rpc();

      assert.fail("Expected constraint violation error but transaction succeeded.");
    } catch (err) {
      console.log("Caught expected error:", err.error.errorMessage);
      assert.include(err.error.errorMessage, "A has one constraint was violated");
    }
  });
});
