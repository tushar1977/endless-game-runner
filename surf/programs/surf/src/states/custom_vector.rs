use anchor_lang::prelude::*;
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MetadataField {
    pub key: String,
    pub value: String,
}
