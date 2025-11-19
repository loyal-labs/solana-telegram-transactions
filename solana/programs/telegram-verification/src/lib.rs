use anchor_lang::prelude::*;

use anchor_lang::solana_program::{
    sysvar::instructions::{load_current_index_checked, load_instruction_at_checked},
};
use core::str::FromStr; 
use hex_literal::hex;

declare_id!("9yiphKYd4b69tR1ZPP8rNwtMeUwWgjYXaXdEzyNziNhz");

// ---- Constants ----
const MAX_VALIDATION_LEN: usize = 768;
const ED25519_HEADER_LEN: usize = 2;   // [sig_count: u8, padding: u8]
const ED25519_OFFSETS_LEN: usize = 14; // 7 * u16 (LE)
const SIG_LEN: usize = 64;
const PUBKEY_LEN: usize = 32;
const TELEGRAM_PUBKEY_PROD: [u8; 32] =
    hex!("e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d");

// ---- Program ----
#[program]
pub mod telegram_verification {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn store(ctx: Context<StoreTelegramInitData>, validation_bytes: Vec<u8>) -> Result<()> {
        require!(validation_bytes.len() <= MAX_VALIDATION_LEN, ErrorCode::InvalidValidationBytesLength);

        let session = &mut ctx.accounts.session;
        session.user_wallet = ctx.accounts.user.key();
        session.validation_bytes = validation_bytes;
        Ok(())
    }

    pub fn verify_telegram_init_data(ctx: Context<VerifyTelegramInitData>) -> Result<()> {
        let expected = &ctx.accounts.session.validation_bytes;

        verify_previous_ed25519_ix(
            &ctx.accounts.instructions,
            expected,
        )?;
        // Optionally mark the session as verified with a flag
        Ok(())
    }
}

// ---- Accounts ----

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct StoreTelegramInitData<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub user: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + TelegramSession::INIT_SPACE,
        seeds = [b"tg_session", user.key().as_ref()],
        bump
    )]
    pub session: Account<'info, TelegramSession>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyTelegramInitData<'info> {
    #[account(mut)]
    pub session: Account<'info, TelegramSession>,

    /// CHECK: we only read from instructions sysvar
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,
}

// ---- State ----

#[account]
#[derive(InitSpace)]
pub struct TelegramSession {
    pub user_wallet: Pubkey,

    #[max_len(MAX_VALIDATION_LEN)]
    pub validation_bytes: Vec<u8>,
}

// ---- Helpers ----
fn verify_previous_ed25519_ix(
    instructions_ai: &AccountInfo,
    expected_msg: &[u8],
) -> Result<()> {
    // 1) Load previous ix
    let cur = load_current_index_checked(instructions_ai)
        .map_err(|_| error!(ErrorCode::NotVerified))? as usize;
    require!(cur > 0, ErrorCode::NotVerified);
    let ix = load_instruction_at_checked(cur - 1, instructions_ai)
        .map_err(|_| error!(ErrorCode::NotVerified))?;

    // 2) Ensure Ed25519 program id
    let ed25519_id = Pubkey::from_str("Ed25519SigVerify111111111111111111111111111")
        .map_err(|_| error!(ErrorCode::InvalidEd25519))?;
    require_keys_eq!(ix.program_id, ed25519_id, ErrorCode::InvalidEd25519);

    // 3) basic bounds check
    // Ed25519 ix data = [header(2)] [offsets(14)] [payload...]
    let data = ix.data.as_slice();
    require!(data.len() >= ED25519_HEADER_LEN, ErrorCode::InvalidEd25519);

    // Exactly one signature
    let sig_count = data[0] as usize;
    require!(sig_count == 1, ErrorCode::InvalidEd25519);

    // Read 7 * u16 (LE) offsets for the single signature
    let need = ED25519_OFFSETS_LEN;
    let offs = data
        .get(ED25519_HEADER_LEN..ED25519_HEADER_LEN + need)
        .ok_or_else(|| error!(ErrorCode::InvalidEd25519))?;

    let read_u16 = |i: usize| -> u16 {
        (offs[i] as u16) | ((offs[i + 1] as u16) << 8)
    };

    let signature_offset              = read_u16(0)  as usize;
    let signature_instruction_index   = read_u16(2);
    let public_key_offset             = read_u16(4)  as usize;
    let public_key_instruction_index  = read_u16(6);
    let message_data_offset           = read_u16(8)  as usize;
    let message_data_size             = read_u16(10) as usize;
    let message_instruction_index     = read_u16(12);

    // All instruction indices must be 0xFFFF (relative to this instruction)
    require!(
        signature_instruction_index  == u16::MAX &&
        public_key_instruction_index == u16::MAX &&
        message_instruction_index    == u16::MAX,
        ErrorCode::InvalidEd25519
    );

    // Payload region starts immediately after offsets
    let data_start = ED25519_HEADER_LEN + need;

    // Compute absolute slices and bounds-check
    let sig_abs = data_start + signature_offset;
    let pk_abs  = data_start + public_key_offset;
    let msg_abs = data_start + message_data_offset;

    require!(sig_abs + SIG_LEN      <= data.len(), ErrorCode::InvalidEd25519);
    require!(pk_abs  + PUBKEY_LEN   <= data.len(), ErrorCode::InvalidEd25519);
    require!(msg_abs + message_data_size <= data.len(), ErrorCode::InvalidEd25519);

    let pk_bytes  = &data[pk_abs..pk_abs + PUBKEY_LEN];
    let msg_bytes = &data[msg_abs..msg_abs + message_data_size];

    // 4) Use hardcoded telegram pk
    let is_telegram_pk = pk_bytes == &TELEGRAM_PUBKEY_PROD;

    // 5) Exact-match telegram pk and message
    require!(is_telegram_pk, ErrorCode::NotVerified);
    require!(msg_bytes == expected_msg, ErrorCode::NotVerified);

    Ok(())
}

// ---- Error Codes ----
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid validation string length")]
    InvalidValidationBytesLength,
    #[msg("Not Verified")]
    NotVerified,
    #[msg("Invalid Ed25519")]
    InvalidEd25519,
    #[msg("Invalid Telegram PK")]
    InvalidTelegramPK,
    #[msg("Invalid Telegram message")]
    InvalidTelegramMessage,
    #[msg("Invalid Telegram signature")]
    InvalidTelegramSignature,
    #[msg("Invalid Telegram public key")]
    InvalidTelegramPublicKey,
}
