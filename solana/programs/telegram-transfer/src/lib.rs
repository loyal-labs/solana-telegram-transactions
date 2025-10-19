use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_lang::solana_program::program::invoke_signed;
use solana_system_interface::instruction as system_instruction;
use ephemeral_rollups_sdk::anchor::ephemeral;


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
}

#[ephemeral]
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
    pub fn claim_deposit(ctx: Context<ClaimDeposit>, amount: u64) -> Result<()> {
        // 1) Auth: verifier must match configured verifier (mocking Arcium)
        require_keys_eq!(ctx.accounts.config.verifier, ctx.accounts.verifier.key(), ErrorCode::NotVerified);

        // 2) Bounds: sufficient deposit & vault lamports (keeping vault rent-exempt)
        let deposit = &mut ctx.accounts.deposit;
        require!(deposit.amount >= amount, ErrorCode::InsufficientDeposit);

        let vault = &mut ctx.accounts.vault;
        let vault_ai = vault.to_account_info();

        let rent_min = Rent::get()?.minimum_balance(8 + Vault::INIT_SPACE);
        let available = vault_ai.lamports().saturating_sub(rent_min);
        require!(available >= amount, ErrorCode::InsufficientVault);

        // 3) vault(PDA) -> recipient w/ system program (works for new wallets)
        let seeds: &[&[u8]] = &[
            VAULT_SEED,
            deposit.username.as_bytes(),
            &[vault.bump],
        ];
        let ix = system_instruction::transfer(
            &vault_ai.key(),                    // from: vault PDA
            &ctx.accounts.recipient.key(),      // to:   recipient (may be new)
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

        // 4) accounting
        deposit.amount = deposit.amount.checked_sub(amount).ok_or(ErrorCode::InsufficientDeposit)?;
        vault.total_deposited = vault.total_deposited.checked_sub(amount).ok_or(ErrorCode::Overflow)?;

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
    pub recipient: UncheckedAccount<'info>,

    /// Mock: the verifier must co-sign (will be Arcium later)
    pub verifier: Signer<'info>,

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

    pub system_program: Program<'info, System>,
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
}

/// A vault storing deposited SOL.
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub bump: u8,
    pub total_deposited: u64,
}
