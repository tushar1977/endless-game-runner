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
    pub const SPACE: usize = 8 + // discriminator
                            32 + // wallet pubkey
                            8 + // high_score (u64)
                            8 + // total_coins (u64)
                            1 + // daily_streak (u8)
                            8 + // last_daily_claim (i64)
                            4 + (32 * Self::MAX_SKINS) + // Vec<Pubkey> (4 bytes for length + 32 bytes per pubkey)
                            32 + // equipped_skin (Pubkey)
                            4 + // games_played (u32)
                            8 + // last_game_timestamp (i64)
                            1 + // has_highscore_nft (bool)
                            32; // highscore_nft_mint (Pubkey)

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
