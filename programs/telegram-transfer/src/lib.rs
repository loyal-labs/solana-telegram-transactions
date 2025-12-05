use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use telegram_verification::TelegramSession;


declare_id!("4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY");

// Seed constants
const DEPOSIT_SEED: &[u8] = b"deposit";
const VAULT_SEED: &[u8] = b"vault";

#[program]
pub mod telegram_transfer {
    use super::*;

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

        require!(ctx.accounts.depositor.key() == deposit.user, ErrorCode::InvalidDepositor);

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

    // 2b) Claim: recipient gets SOL if the username is verified
    pub fn claim_deposit(
        ctx: Context<ClaimDeposit>, 
        amount: u64,
    ) -> Result<()> {
        let deposit = &mut ctx.accounts.deposit;
        let session = &ctx.accounts.session;
        let vault   = &mut ctx.accounts.vault;
        let vault_ai = vault.to_account_info();
        let recipient_ai = ctx.accounts.recipient.to_account_info();
        
        // --- verification ---
        require!(session.verified, ErrorCode::NotVerified);
        require!(session.username == deposit.username, ErrorCode::InvalidUsername);
        require!(session.user_wallet == ctx.accounts.recipient.key(), ErrorCode::InvalidRecipient);
        require!(deposit.amount >= amount, ErrorCode::InsufficientDeposit);

        let rent_min = Rent::get()?.minimum_balance(8 + Vault::INIT_SPACE);
        let available = vault_ai.lamports().saturating_sub(rent_min);
        require!(available >= amount, ErrorCode::InsufficientVault);

        // --- transfer ---
        **vault_ai.try_borrow_mut_lamports()? -= amount;
        **recipient_ai.try_borrow_mut_lamports()? += amount;

        // --- accounting ---
        deposit.amount = deposit.amount.checked_sub(amount).ok_or(ErrorCode::InsufficientDeposit)?;
        vault.total_deposited = vault.total_deposited.checked_sub(amount).ok_or(ErrorCode::Overflow)?;

        Ok(())
    }
}

// ---------------- Accounts ----------------
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
        seeds = [VAULT_SEED], 
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
        seeds = [VAULT_SEED],
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
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [DEPOSIT_SEED, deposit.user.as_ref(), deposit.username.as_bytes()],
        bump
    )]
    pub deposit: Account<'info, Deposit>,

    /// CHECK: We only read from instructions sysvar
    #[account(
        constraint = session.user_wallet == recipient.key() @ ErrorCode::InvalidRecipient,
        constraint = session.verified @ ErrorCode::NotVerified
    )]
    pub session: Account<'info, TelegramSession>,
    pub system_program: Program<'info, System>,
}

// ---------------- State ----------------

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

// ---------------- Error Codes ----------------
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
    #[msg("Invalid Username")]
    InvalidUsername,
    #[msg("Invalid Recipient")]
    InvalidRecipient,
    #[msg("Invalid Depositor")]
    InvalidDepositor,
}
