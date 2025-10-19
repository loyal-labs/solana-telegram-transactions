use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

declare_id!("Gfxxzt3Dxpjpz8sh8XP6yL7UijniKXw7Yk8YZnDKikiN");

const DEPOSIT_SEED: &[u8] = b"deposit";
const VAULT_SEED: &[u8] = b"vault";

#[error_code]
pub enum ErrorCode {
    #[msg("Overflow")]
    Overflow,
    #[msg("Insufficient Vault")]
    InsufficientVault,
    #[msg("Insufficient Deposit")]
    InsufficientDeposit,
}

#[ephemeral]
#[program]
pub mod telegram_transfer {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        let deposit = &mut _ctx.accounts.deposit;
        deposit.set_inner(Deposit {
            user: _ctx.accounts.user.key(),
            amount: 0,
        });
        Ok(())
    }

    pub fn modify_deposit(ctx: Context<ModifyDeposit>, args: ModifyDepositArgs) -> Result<()> {
        let deposit = &mut ctx.accounts.deposit;
        let user = &mut ctx.accounts.user;
        let vault_bump = ctx.bumps.vault;
        let vault = &mut ctx.accounts.vault;

        // init metadata
        if vault.bump == 0 {
            vault.bump = vault_bump;
        }

        if args.increase {
            // user -> vault (lamports)
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: user.to_account_info(),
                        to:   vault.to_account_info(),
                    },
                ),
                args.amount,
            )?;
            deposit.amount = deposit.amount.checked_add(args.amount).ok_or(ErrorCode::Overflow)?;
            vault.total_deposited = vault.total_deposited.checked_add(args.amount).ok_or(ErrorCode::Overflow)?;
        } else {
            // keep vault rent-exempt
            let rent_min = Rent::get()?.minimum_balance(8 + Vault::INIT_SPACE);
            let vault_ai = vault.to_account_info();
            let available = vault_ai.lamports().saturating_sub(rent_min);
            require!(available >= args.amount, ErrorCode::InsufficientVault);

            // program-owned PDA -> user
            **vault_ai.try_borrow_mut_lamports()? -= args.amount;
            **user.to_account_info().try_borrow_mut_lamports()? += args.amount;

            // update vault accounting
            deposit.amount = deposit.amount.checked_sub(args.amount).ok_or(ErrorCode::InsufficientDeposit)?;
            vault.total_deposited = vault.total_deposited.checked_sub(args.amount).ok_or(ErrorCode::Overflow)?;
        }

        Ok(())
    }

    pub fn transfer_deposit(ctx: Context<TransferDeposit>, amount: u64) -> Result<()> {
        let src = &mut ctx.accounts.source_deposit; // deposit
        let dst = &mut ctx.accounts.destination_deposit; // user deposit
 
        src.amount = src.amount.checked_sub(amount).ok_or(ErrorCode::InsufficientDeposit)?;
        dst.amount = dst.amount.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        // vault.total_deposited unchanged (just moving between users)
        Ok(())
    }

    /// ER CPI to delegate deposit
    pub fn delegate(ctx: Context<DelegateDeposit>, user: Pubkey) -> Result<()> {
        ctx.accounts.delegate_deposit(
            &ctx.accounts.payer,
            &[DEPOSIT_SEED, user.as_ref()],
            DelegateConfig {
                commit_frequency_ms: 0,
                validator: Some(pubkey!("mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev")),
            }
        )?;
        Ok(())
    }

    /// commits to main and undelegates from validator
    pub fn undelegate(ctx: Context<UndelegateDeposit>, _user: Pubkey) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.deposit.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: We let anyone create a deposit
    pub user: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Deposit::INIT_SPACE,
        seeds = [DEPOSIT_SEED, user.key().as_ref()],
        bump
    )]
    pub deposit: Account<'info, Deposit>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ModifyDepositArgs {
    pub amount: u64,
    pub increase: bool,
}


#[derive(Accounts)]
pub struct ModifyDeposit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub user: Signer<'info>,

    /// one global vault with SOL
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Vault::INIT_SPACE,
        seeds = [VAULT_SEED],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    /// one user = one deposit
    #[account(
        mut,
        seeds = [DEPOSIT_SEED, deposit.user.as_ref()],
        bump,
        has_one = user
    )]
    pub deposit: Account<'info, Deposit>,

    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct TransferDeposit<'info> {
    /// CHECK: matched against the deposit account
    pub user: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [DEPOSIT_SEED, user.key().as_ref()],
        bump,
        has_one = user,
    )]
    pub source_deposit: Account<'info, Deposit>,
    #[account(
        mut,
        seeds = [DEPOSIT_SEED, destination_deposit.user.as_ref()],
        bump,
    )]
    pub destination_deposit: Account<'info, Deposit>,
}


/// A deposit account for a user and token mint.
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
    /// PDA bump
    pub bump: u8,
    /// total deposited SOL
    pub total_deposited: u64,
}

#[delegate]
#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct DelegateDeposit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Checked counter accountby the delegate program
    #[account(
        mut,
        del,
        seeds = [DEPOSIT_SEED, user.as_ref()],
        bump,
    )]
    pub deposit: AccountInfo<'info>,
}


#[commit]
#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct UndelegateDeposit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: undelegated PDA
    #[account(
        mut,
        seeds = [DEPOSIT_SEED, user.as_ref()],
        bump
    )]
    pub deposit: AccountInfo<'info>,
}
