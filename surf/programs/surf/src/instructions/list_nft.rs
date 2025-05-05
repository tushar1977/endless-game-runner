use crate::states::escrow::{self, Escrow};
use crate::states::nft_authority::NftAuthority;
use crate::states::player_data::PlayerProfile;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount};

pub fn list_nft(ctx: Context<ListNft>, price: u64) -> Result<()> {
    msg!("Initializing escrow account...");

    let escrow = &mut ctx.accounts.escrow;
    escrow.mint = ctx.accounts.mint.key();
    escrow.seller = ctx.accounts.signer.key();
    escrow.price = price;
    escrow.skin_to_list = ctx.accounts.skin_to_list.key();
    escrow.bump = ctx.bumps.escrow;
    escrow.is_closed = false;

    msg!("Transferring NFT to escrow...");

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = token_2022::Transfer {
        from: ctx.accounts.skin_to_list_token_account.to_account_info(),
        to: ctx.accounts.escrow_token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token_2022::transfer(cpi_ctx, 1)?;

    msg!("NFT listed successfully!");
    Ok(())
}

#[derive(Accounts)]
pub struct ListNft<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump,
        has_one = wallet
    )]
    pub player: Account<'info, PlayerProfile>,

    /// CHECK: Checked via has_one in `player`
    #[account(
        seeds = [b"wallet", signer.key().as_ref()],
        bump,
    )]
    pub wallet: AccountInfo<'info>,

    /// The mint of the NFT
    pub mint: AccountInfo<'info>,

    #[account(
        mint::token_program = token_program,
        address = mint.key()
    )]
    pub skin_to_list: InterfaceAccount<'info, Mint>,

    /// NFT token account owned by signer
    #[account(
        mut,
        associated_token::mint = skin_to_list,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub skin_to_list_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        payer = signer,
        space = Escrow::INIT_SPACE,
        seeds = [b"escrow", signer.key().as_ref(), skin_to_list.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// ATA owned by escrow PDA for holding the NFT
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = skin_to_list,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub escrow_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
