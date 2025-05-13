use crate::errors::CustomErrors;
use crate::states::escrow::Escrow;
use crate::states::player_data::PlayerProfile;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount};

pub fn buy_nft(ctx: Context<BuyNFT>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(
        ctx.accounts.escrow_token_account.amount > 0,
        CustomErrors::EscrowTokenBalanceZero
    );
    require!(
        ctx.accounts.buyer.key() != ctx.accounts.seller.key(),
        CustomErrors::EscrowTokenBalanceZero
    );
    let cpi_program = ctx.accounts.token_program.to_account_info();

    // Transfer NFT from escrow to buyer
    let cpi_accounts = token_2022::TransferChecked {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: escrow.to_account_info(),
        mint: ctx.accounts.nft_mint.to_account_info(),
    };

    // Define signer seeds for the escrow authority
    let signer_seeds = &[
        b"escrow",
        ctx.accounts.seller.key.as_ref(),
        escrow.skin_to_list.as_ref(),
        &[escrow.bump],
    ];
    let signer = &[&signer_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token_2022::transfer_checked(cpi_ctx, 1, 0)?;
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.seller.key(),
        escrow.price,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.seller.to_account_info(),
        ],
    )?;

    let cpi_close_accounts = token_2022::CloseAccount {
        account: ctx.accounts.escrow_token_account.to_account_info(),
        destination: ctx.accounts.buyer.to_account_info(),
        authority: escrow.to_account_info(),
    };

    let cpi_close_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_close_accounts,
        signer,
    );
    token_2022::close_account(cpi_close_ctx)?;

    escrow.is_closed = true;
    msg!("NFT Sold successfully!");

    Ok(())
}
#[derive(Accounts)]
pub struct BuyNFT<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub seller: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"player", buyer.key().as_ref()],
        bump,
        has_one = wallet
    )]
    pub player: Account<'info, PlayerProfile>,

    /// CHECK: Checked via `has_one = wallet` in player
    #[account(
        seeds = [b"wallet", buyer.key().as_ref()],
        bump,
    )]
    pub wallet: AccountInfo<'info>,

    /// The mint of the NFT to be bought
    #[account(
        mint::token_program = token_program
    )]
    pub nft_mint: InterfaceAccount<'info, Mint>,

    /// Maker's ATA for the NFT (used to send SOL)
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Escrow account holding NFT listing info
    #[account(
        mut,
        close = seller,
        seeds = [b"escrow", seller.key().as_ref(), nft_mint.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    /// Escrow's ATA holding the NFT
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub escrow_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
