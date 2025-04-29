use anchor_lang::prelude::*;
pub mod errors;
pub mod instructions;
pub mod states;

use crate::instructions::__client_accounts_init_player;
use crate::instructions::__client_accounts_mint_nft;
use crate::instructions::__client_accounts_update_nft;
use crate::instructions::__client_accounts_update_player;
use crate::instructions::{init_Player, InitPlayer};
use crate::instructions::{mint_nft, MintNft};
use crate::instructions::{update_nft, UpdateNft};
use crate::instructions::{update_player, UpdatePlayer};

declare_id!("A9YHxLTPtT6YSCi793gNFMB4nUTByXhq9DzgKf169Zf");

#[program]
pub mod surf {

    use super::*;

    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        init_Player::init_player(ctx)
    }

    pub fn update_player(
        ctx: Context<UpdatePlayer>,
        score: u64,
        coins_collected: u64,
    ) -> Result<()> {
        update_player::update_player(ctx, score, coins_collected)
    }

    pub fn mint_nft(
        ctx: Context<MintNft>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        mint_nft::mint_highest_score_nft(ctx, uri, name, symbol)
    }

    pub fn update_nft(ctx: Context<UpdateNft>, high_score: u64) -> Result<()> {
        update_nft::update_nft(ctx, high_score)
    }
}
