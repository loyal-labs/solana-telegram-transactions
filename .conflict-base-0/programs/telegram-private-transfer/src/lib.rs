use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV");

// Seed constants
const DEPOSIT_SEED: &[u8] = b"deposit";
const VAULT_SEED: &[u8] = b"vault";

#[program]
pub mod telegram_private_transfer {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    // 1) Depositor earmarks SOL.
    pub fn make_deposit(ctx: Context<MakeDeposit>, amount: u64) -> Result<()> {
        let deposit = &mut ctx.accounts.deposit;
        let vault   = &mut ctx.accounts.vault;

        // init deposit on first use
        if deposit.user == Pubkey::default() {
            deposit.user = ctx.accounts.depositor.key();
            deposit.amount = 0;
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
}

// ---------------- Accounts ----------------
#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct MakeDeposit<'info> {
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
        seeds = [DEPOSIT_SEED, depositor.key().as_ref()],
        bump
    )]
    pub deposit: Account<'info, Deposit>,

    pub system_program: Program<'info, System>,
}

// ---------------- State ----------------

/// A deposit account for a user.
#[account]
#[derive(InitSpace)]
pub struct Deposit {
    pub user: Pubkey,
    pub amount: u64,
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
