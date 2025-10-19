use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use anchor_lang::solana_program::{
    program::invoke_signed,
    sysvar::instructions::{load_current_index_checked, load_instruction_at_checked},
    system_instruction,
};

use ::borsh::BorshSerialize;        // disambiguate borsh
use sha2::{Digest, Sha256};         // SHA-256 for digest
use core::str::FromStr; 

// Ed25519 ix header/offsets (for exactly 1 signature)
const ED25519_HEADER_LEN: usize = 2;   // [sig_count: u8, padding: u8]
const ED25519_OFFSETS_LEN: usize = 14; // 7 * u16 (LE)
const SIG_LEN: usize = 64;
const PUBKEY_LEN: usize = 32;

declare_id!("Gfxxzt3Dxpjpz8sh8XP6yL7UijniKXw7Yk8YZnDKikiN");

const DEPOSIT_SEED: &[u8] = b"deposit";
const VAULT_SEED: &[u8] = b"vault";
const CONFIG_SEED: &[u8] = b"config";


#[error_code]
pub enum ErrorCode {
    #[msg("Overflow")]
    Overflow,
    #[msg("Insufficient Vault")]
    InsufficientVault,
    #[msg("Insufficient Deposit")]
    InsufficientDeposit,
    #[msg("Not Verified")]
    NotVerified,
    #[msg("Expired Signature")]
    ExpiredSignature,
    #[msg("Replay")]
    Replay,
    #[msg("Invalid Ed25519")]
    InvalidEd25519,
}

#[program]
pub mod telegram_transfer {
    use super::*;

    // ---- Setup (mock Arcium gate) ----
    pub fn initialize_config(ctx: Context<InitializeConfig>, verifier: Pubkey) -> Result<()> {
        ctx.accounts.config.set_inner(Config {
            admin: ctx.accounts.admin.key(),
            verifier,
        });
        Ok(())
    }

    pub fn set_verifier(ctx: Context<SetVerifier>, new_verifier: Pubkey) -> Result<()> {
        // Admin-only
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.admin.key());
        ctx.accounts.config.verifier = new_verifier;
        Ok(())
    }

    // ---- Escrow flows ----

    // 1) Depositor earmarks SOL for a username.
    pub fn deposit_for_username(ctx: Context<DepositForUsername>, username: String, amount: u64) -> Result<()> {
        let deposit = &mut ctx.accounts.deposit;
        let vault   = &mut ctx.accounts.vault;

        // init deposit on first use
        if deposit.user == Pubkey::default() {
            deposit.user = ctx.accounts.depositor.key();
            deposit.username = username.clone();
            deposit.amount = 0;
            deposit.last_nonce = 0;
        }

        // init vault bump (once)
        if vault.bump == 0 {
            vault.bump = ctx.bumps.vault;
        }

        // depositor -> vault lamports
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor.to_account_info(),
                    to:   vault.to_account_info(),
                },
            ),
            amount,
        )?;

        // book-keeping
        deposit.amount = deposit.amount.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        vault.total_deposited = vault.total_deposited.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        Ok(())
    }

    // 2a) Refund: depositor pulls back to own wallet.
    pub fn refund_deposit(ctx: Context<RefundDeposit>, amount: u64) -> Result<()> {
        let deposit = &mut ctx.accounts.deposit;
        let vault   = &mut ctx.accounts.vault;
        let vault_ai = vault.to_account_info();

        // ensure this deposit belongs to signer
        require_keys_eq!(deposit.user, ctx.accounts.depositor.key());

        // keep vault rent-exempt
        let rent_min = Rent::get()?.minimum_balance(8 + Vault::INIT_SPACE);
        let available = vault_ai.lamports().saturating_sub(rent_min);
        require!(available >= amount, ErrorCode::InsufficientVault);

        // move lamports: vault -> depositor
        **vault_ai.try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.depositor.to_account_info().try_borrow_mut_lamports()? += amount;

        // accounting
        deposit.amount = deposit.amount.checked_sub(amount).ok_or(ErrorCode::InsufficientDeposit)?;
        vault.total_deposited = vault.total_deposited.checked_sub(amount).ok_or(ErrorCode::Overflow)?;
        Ok(())
    }

    // 2b) Claim: recipient gets SOL if the verifier signs (mock Arcium).
    pub fn claim_deposit(
        ctx: Context<ClaimDeposit>, 
        amount: u64,
        nonce: u64,
        deadline_slot: u64
    ) -> Result<()> {
        // --- freshness & replay ---
        require!(ctx.accounts.clock.slot <= deadline_slot, ErrorCode::ExpiredSignature);
        
        let deposit = &mut ctx.accounts.deposit;
        require!(nonce > deposit.last_nonce, ErrorCode::Replay);

        // --- bounds ---
        require!(deposit.amount >= amount, ErrorCode::InsufficientDeposit);
        let vault = &mut ctx.accounts.vault;
        let vault_ai = vault.to_account_info();

        let rent_min = Rent::get()?.minimum_balance(8 + Vault::INIT_SPACE);
        let available = vault_ai.lamports().saturating_sub(rent_min);
        require!(available >= amount, ErrorCode::InsufficientVault);

        // --- recompute the 32-byte digest the verifier signed ---
        let digest = claim_digest(
            ctx.program_id,
            &deposit.username,
            &ctx.accounts.recipient.key(),
            amount,
            &deposit.key(),
            &vault.key(),
            nonce,
            deadline_slot,
        );

        // --- verify the immediately-previous ed25519 ix ---
        verify_previous_ed25519_ix(
            &ctx.accounts.instructions,
            &ctx.accounts.config.verifier,
            &digest,
        )?;

        // --- transfer vault(PDA) -> recipient ---
        let seeds: &[&[u8]] = &[
            VAULT_SEED,
            deposit.username.as_bytes(),
            &[vault.bump],
        ];
        let ix = system_instruction::transfer(
            &vault_ai.key(),
            &ctx.accounts.recipient.key(),
            amount,
        );
        invoke_signed(
            &ix,
            &[
                vault_ai.clone(),
                ctx.accounts.recipient.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[seeds],
        )?;

        // --- accounting + nonce bump ---
        deposit.amount = deposit.amount.checked_sub(amount).ok_or(ErrorCode::InsufficientDeposit)?;
        vault.total_deposited = vault.total_deposited.checked_sub(amount).ok_or(ErrorCode::Overflow)?;
        deposit.last_nonce = nonce;


        Ok(())


    }


    
}

// ---------------- Accounts ----------------
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SetVerifier<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct DepositForUsername<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,      // rent for PDAs
    #[account(mut)]
    pub depositor: Signer<'info>,  // funds come from here

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Vault::INIT_SPACE,
        seeds = [VAULT_SEED, username.as_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Deposit::INIT_SPACE,
        seeds = [DEPOSIT_SEED, depositor.key().as_ref(), username.as_bytes()],
        bump
    )]
    pub deposit: Account<'info, Deposit>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundDeposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, deposit.username.as_bytes()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [DEPOSIT_SEED, depositor.key().as_ref(), deposit.username.as_bytes()],
        bump
    )]
    pub deposit: Account<'info, Deposit>,
}

#[derive(Accounts)]
pub struct ClaimDeposit<'info> {
    /// can be a new address
    #[account(mut)]
    /// CHECK: Recipient can be any Solana account; lamport transfer is valid without further checks.
    pub recipient: UncheckedAccount<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [VAULT_SEED, deposit.username.as_bytes()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [DEPOSIT_SEED, deposit.user.as_ref(), deposit.username.as_bytes()],
        bump
    )]
    pub deposit: Account<'info, Deposit>,

    /// CHECK: Instructions sysvar provides prior instruction data; Anchor does not enforce extra checks.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

// ---------------- State ----------------
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub verifier: Pubkey,
}

/// A deposit account for a user and token mint.
#[account]
#[derive(InitSpace)]
pub struct Deposit {
    pub user: Pubkey,
    #[max_len(32)]
    pub username: String,
    pub amount: u64,
    pub last_nonce: u64,
}

/// A vault storing deposited SOL.
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub bump: u8,
    pub total_deposited: u64,
}

// ---------------- Helpers ----------------
#[derive(BorshSerialize)]
struct ClaimMsg {
    tag: [u8; 8],
    program_id: Pubkey,
    username: String,
    recipient: Pubkey,
    amount: u64,
    deposit: Pubkey,
    vault: Pubkey,
    nonce: u64,
    deadline_slot: u64,
}

fn claim_digest(
    program_id: &Pubkey,
    username: &str,
    recipient: &Pubkey,
    amount: u64,
    deposit: &Pubkey,
    vault: &Pubkey,
    nonce: u64,
    deadline_slot: u64,
) -> [u8; 32] {
    let msg = ClaimMsg {
        tag: *b"TGCLM001",
        program_id: *program_id,
        username: username.to_string(),
        recipient: *recipient,
        amount,
        deposit: *deposit,
        vault: *vault,
        nonce,
        deadline_slot,
    };
    let mut hasher = Sha256::new();
    hasher.update(msg.try_to_vec().unwrap());
    let mut out = [0u8; 32];
    out.copy_from_slice(&hasher.finalize());
    out
}

fn verify_previous_ed25519_ix(
    instructions_ai: &AccountInfo,
    expected_signer: &Pubkey,
    expected_msg: &[u8],
) -> Result<()> {
    // Load the immediately-previous instruction safely
    let cur = load_current_index_checked(instructions_ai)
        .map_err(|_| error!(ErrorCode::NotVerified))? as usize;
    require!(cur > 0, ErrorCode::NotVerified);
    let ix = load_instruction_at_checked(cur - 1, instructions_ai)
        .map_err(|_| error!(ErrorCode::NotVerified))?;

    // Must be the native Ed25519 verifier program
    let ed25519_id = Pubkey::from_str("Ed25519SigVerify111111111111111111111111111")
        .map_err(|_| error!(ErrorCode::InvalidEd25519))?;
    require_keys_eq!(ix.program_id, ed25519_id, ErrorCode::InvalidEd25519);

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

    // Exact-match signer and message
    require!(pk_bytes == expected_signer.as_ref(), ErrorCode::NotVerified);
    require!(msg_bytes == expected_msg, ErrorCode::NotVerified);

    Ok(())
}
