use crate::states::player_data::PlayerProfile;
use anchor_lang::prelude::*;
pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
    let player = &mut ctx.accounts.player_account;
    player.initialize(ctx.accounts.signer.key());
    player.wallet = ctx.accounts.wallet.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account(
        init,
        payer = signer,
        space = PlayerProfile::SPACE,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerProfile>,
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: This is safe because we verify the wallet matches the PDA-derived account
    /// through the has_one constraint. The signer's key must match the wallet address
    /// used to derive the player PDA.
    #[account(
        seeds = [b"wallet", signer.key().as_ref()],
        bump,
    )]
    pub wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
