use anchor_lang::prelude::Pubkey;
use anchor_lang::prelude::*;
#[account]
pub struct Escrow {
    pub seller: Pubkey,
    pub price: u64,
    pub skin_to_list: Pubkey,
    pub bump: u8,
    pub is_closed: bool,
}

impl Escrow {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 8 + 32 + 32 + 32;
}
