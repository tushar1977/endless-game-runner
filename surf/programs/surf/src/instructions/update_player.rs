use anchor_lang::prelude::*;

use crate::states::player_data::PlayerProfile;
pub fn update_player(ctx: Context<UpdatePlayer>, score: u64, coins_collected: u64) -> Result<()> {
    let player = &mut ctx.accounts.player;
    let clock = Clock::get()?;

    player.games_played += 1;
    player.last_game_timestamp = clock.unix_timestamp;
    player.total_coins += coins_collected;
    if score > player.high_score {
        player.high_score = score;
    }
    Ok(())
}

#[derive(Accounts)]
pub struct UpdatePlayer<'info> {
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump,
        has_one = wallet
    )]
    pub player: Account<'info, PlayerProfile>,

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
}
