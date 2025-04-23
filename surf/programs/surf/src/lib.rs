use anchor_lang::prelude::*;

declare_id!("Ahyi5zC8KucSuDKY1BxRp9v1x61jEsuamTcR9cky8NYm");

#[program]
pub mod surf {

    use super::*;

    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player_account;
        player.initialize(ctx.accounts.signer.key());
        player.wallet = ctx.accounts.wallet.key();
        Ok(())
    }

    pub fn update_player(
        ctx: Context<UpdatePlayer>,
        score: u64,
        coins_collected: u64,
    ) -> Result<()> {
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

#[account]
pub struct PlayerProfile {
    pub wallet: Pubkey,
    pub high_score: u64,
    pub total_coins: u64,
    pub daily_streak: u8,
    pub last_daily_claim: i64,
    pub skins_owned: Vec<Pubkey>,
    pub equipped_skin: Pubkey,
    pub games_played: u32,
    pub last_game_timestamp: i64,
}

impl PlayerProfile {
    pub const SPACE: usize = 8 + 32 + 8 + 8 + 1 + 8 + 4 + (32 * 10) + 32 + 4 + 8;

    pub fn initialize(&mut self, wallet: Pubkey) {
        self.wallet = wallet;
        self.high_score = 0;
        self.total_coins = 0;
        self.daily_streak = 0;
        self.last_daily_claim = 0;
        self.skins_owned = Vec::with_capacity(10);
        self.equipped_skin = Pubkey::default();
        self.games_played = 0;
        self.last_game_timestamp = 0;
    }
}
