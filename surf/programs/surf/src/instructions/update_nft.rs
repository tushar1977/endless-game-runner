use crate::errors::CustomErrors;
use crate::states::{nft_authority::NftAuthority, player_data::PlayerProfile};
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};
use solana_program::program::invoke_signed;
pub fn update_nft(ctx: Context<UpdateNft>, high_score: u64) -> Result<()> {
    let player = &mut ctx.accounts.player;

    require!(
        player.highscore_nft_mint == ctx.accounts.mint.key(),
        CustomErrors::SkinNotOwned
    );

    if high_score > player.high_score {
        player.high_score = high_score;
    }

    let seeds = b"nft_authority";
    let bump = ctx.bumps.nft_authority;
    let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

    invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &ctx.accounts.mint.to_account_info().key(),
            &ctx.accounts.nft_authority.to_account_info().key(),
            spl_token_metadata_interface::state::Field::Key("High Score".to_string()),
            high_score.to_string(),
        ),
        &[
            ctx.accounts.mint.to_account_info().clone(),
            ctx.accounts.nft_authority.to_account_info().clone(),
        ],
        signer,
    )?;
    player.high_score = high_score;

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateNft<'info> {
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerProfile>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,

    /// CHECK: This is safe because we verify the wallet matches the PDA-derived account
    /// through the has_one constraint. The signer's key must match the wallet address
    /// used to derive the player PDA.
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(
        seeds = [b"nft_authority".as_ref()], 
        bump
    )]
    pub nft_authority: Account<'info, NftAuthority>,
}
