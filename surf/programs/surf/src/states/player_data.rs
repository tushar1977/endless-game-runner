use anchor_lang::prelude::*;
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
    pub has_highscore_nft: bool,
    pub highscore_nft_mint: Pubkey,
}

impl PlayerProfile {
    pub const MAX_SKINS: usize = 10;
    pub const SPACE: usize = 350;

    pub fn initialize(&mut self, wallet: Pubkey) {
        self.wallet = wallet;
        self.high_score = 0;
        self.total_coins = 0;
        self.daily_streak = 0;
        self.last_daily_claim = 0;
        self.skins_owned = Vec::new();
        self.equipped_skin = Pubkey::default();
        self.games_played = 0;
        self.last_game_timestamp = 0;
        self.has_highscore_nft = false;
        self.highscore_nft_mint = Pubkey::default();
    }
}
