pub use crate::errors::CustomErrors;
use crate::states::nft_authority::NftAuthority;
use crate::states::player_data::PlayerProfile;
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token_2022::{self, Token2022},
    token_interface::spl_token_2022::instruction::AuthorityType,
};
use solana_program::program::{invoke, invoke_signed};
use spl_token_2022::{extension::ExtensionType, state::Mint};
pub fn mint_highest_score_nft(
    ctx: Context<MintNft>,
    uri: String,
    name: String,
    symbol: String,
) -> Result<()> {
    let player = &mut ctx.accounts.player;
    require!(player.high_score > 0, CustomErrors::NoHighscoreToMint);
    let space =
        match ExtensionType::try_calculate_account_len::<Mint>(&[ExtensionType::MetadataPointer]) {
            Ok(space) => space,
            Err(_) => {
                return err!(CustomErrors::InvalidMintAccountSpace);
            }
        };

    let meta_data_space = 250;
    let lamports_required = Rent::get()?.minimum_balance(space + meta_data_space);

    msg!(
        "Create Mint and metadata account size and cost: {} lamports: {}",
        space as u64,
        lamports_required
    );

    system_program::create_account(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.signer.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        lamports_required,
        space as u64,
        &ctx.accounts.token_program.key(),
    )?;

    system_program::assign(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            system_program::Assign {
                account_to_assign: ctx.accounts.mint.to_account_info(),
            },
        ),
        &token_2022::ID,
    )?;

    let init_meta_data_pointer_ix =
        match spl_token_2022::extension::metadata_pointer::instruction::initialize(
            &Token2022::id(),
            &ctx.accounts.mint.key(),
            Some(ctx.accounts.nft_authority.key()),
            Some(ctx.accounts.mint.key()),
        ) {
            Ok(ix) => ix,
            Err(_) => {
                return err!(CustomErrors::CantInitializeMetadataPointer);
            }
        };

    invoke(
        &init_meta_data_pointer_ix,
        &[
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.nft_authority.to_account_info(),
        ],
    )?;

    // Initialize the mint cpi
    let mint_cpi_ix = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token_2022::InitializeMint2 {
            mint: ctx.accounts.mint.to_account_info(),
        },
    );

    token_2022::initialize_mint2(mint_cpi_ix, 0, &ctx.accounts.nft_authority.key(), None).unwrap();

    let seeds = b"nft_authority";
    let bump = ctx.bumps.nft_authority;
    let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

    msg!(
        "Init metadata {0}",
        ctx.accounts.nft_authority.to_account_info().key
    );

    // Init the metadata account
    let init_token_meta_data_ix = &spl_token_metadata_interface::instruction::initialize(
        &spl_token_2022::id(),
        ctx.accounts.mint.key,
        ctx.accounts.nft_authority.to_account_info().key,
        ctx.accounts.mint.key,
        ctx.accounts.nft_authority.to_account_info().key,
        name,
        symbol,
        uri,
    );

    invoke_signed(
        init_token_meta_data_ix,
        &[
            ctx.accounts.mint.to_account_info().clone(),
            ctx.accounts.nft_authority.to_account_info().clone(),
        ],
        signer,
    )?;

    invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            ctx.accounts.mint.key,
            ctx.accounts.nft_authority.to_account_info().key,
            spl_token_metadata_interface::state::Field::Key("level".to_string()),
            "1".to_string(),
        ),
        &[
            ctx.accounts.mint.to_account_info().clone(),
            ctx.accounts.nft_authority.to_account_info().clone(),
        ],
        signer,
    )?;

    associated_token::create(CpiContext::new(
        ctx.accounts.associated_token_program.to_account_info(),
        associated_token::Create {
            payer: ctx.accounts.signer.to_account_info(),
            associated_token: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    ))?;

    token_2022::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_2022::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.nft_authority.to_account_info(),
            },
            signer,
        ),
        1,
    )?;
    token_2022::set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_2022::SetAuthority {
                current_authority: ctx.accounts.nft_authority.to_account_info(),
                account_or_mint: ctx.accounts.mint.to_account_info(),
            },
            signer,
        ),
        AuthorityType::MintTokens,
        None,
    )?;
    player.has_highscore_nft = true;
    player.highscore_nft_mint = ctx.accounts.mint.key();
    player.skins_owned.push(ctx.accounts.mint.key());
    msg!(
        "NFT Minted Pubkey:= {} by {}",
        ctx.accounts.mint.key(),
        ctx.accounts.player.key()
    );
    Ok(())
}

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump,
        has_one = wallet
    )]
    pub player: Account<'info, PlayerProfile>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    /// CHECK: We will create this one for the user
    #[account(mut)]
    pub token_account: AccountInfo<'info>,
    #[account(mut)]
    pub mint: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(init_if_needed, seeds = [b"nft_authority".as_ref()], bump, space = 8, payer = signer)]
    pub nft_authority: Account<'info, NftAuthority>,

    /// CHECK: This is safe because we verify the wallet matches the PDA-derived account
    /// through the has_one constraint. The signer's key must match the wallet address
    /// used to derive the player PDA.
    #[account(
        seeds = [b"wallet", signer.key().as_ref()],
        bump,
    )]
    pub wallet: AccountInfo<'info>,
}
