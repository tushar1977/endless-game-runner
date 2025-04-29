use anchor_lang::prelude::*;
#[error_code]
pub enum CustomErrors {
    #[msg("No high score to mint as NFT")]
    NoHighscoreToMint,
    #[msg("Daily skin claim not yet available")]
    DailyClaimNotAvailable,
    #[msg("Player does not own this skin")]
    SkinNotOwned,
    #[msg("Cannot list your skin")]
    SkinNotListed,
    #[msg("Invalid Mint account space")]
    InvalidMintAccountSpace,
    #[msg("Cant initialize metadata_pointer")]
    CantInitializeMetadataPointer,
    #[msg("Player already has NFT")]
    AlreadyHasNFT,
    #[msg("Sale is not active.")]
    SaleNotActive,
    #[msg("Minimum listing is 0.001 sol")]
    MinimumListingPrice,
    #[msg("INvalid ID")]
    InvalidTokenProgram,
    #[msg("Ivalud escrown")]
    InvalidEscrowProgram,
}
