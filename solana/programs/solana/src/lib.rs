use anchor_lang::prelude::*;

declare_id!("3PqMNJhv6R5m88rb3pW3RjASMbNzW1XW3nPdB6XWNb1w");

#[program]
pub mod solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
