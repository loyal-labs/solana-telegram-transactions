use anyhow::{bail, Context, Result};
use log::debug;
use serde_json::json;
use solana_client::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_sdk::{
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    transaction::Transaction,
};
use solana_system_interface::instruction as system_instruction;
use spl_associated_token_account_client::{
    address::get_associated_token_address_with_program_id,
    instruction::create_associated_token_account_idempotent,
};
use spl_token::{instruction as token_instruction, native_mint::id as native_mint_id};
use std::{thread::sleep, time::{Duration, Instant}};

use crate::{
    cli::OutputFormat,
    constants::{DEPOSIT_DISCRIMINATOR, USERNAME_DEPOSIT_DISCRIMINATOR},
    pda::{delegation_program_id, program_id},
    types::{DepositAccountData, UsernameDepositAccountData},
};

pub(crate) fn wait_for_owner(
    client: &RpcClient,
    account: &Pubkey,
    expected_owner: &Pubkey,
    timeout: Duration,
    interval: Duration,
    commitment: CommitmentConfig,
) -> Result<()> {
    let start = Instant::now();
    debug!(
        "waiting for owner: account={}, expected_owner={}, timeout_secs={}, interval_secs={}",
        account,
        expected_owner,
        timeout.as_secs(),
        interval.as_secs()
    );
    while start.elapsed() < timeout {
        if let Some(info) = get_account_opt(client, account, commitment)? {
            debug!(
                "owner poll: account={}, current_owner={}, expected_owner={}",
                account, info.owner, expected_owner
            );
            if info.owner == *expected_owner {
                return Ok(());
            }
        }
        sleep(interval);
    }
    bail!(
        "timeout waiting for owner {} on account {}",
        expected_owner,
        account
    )
}

pub(crate) fn wait_for_account_exists(
    client: &RpcClient,
    account: &Pubkey,
    timeout: Duration,
    interval: Duration,
    commitment: CommitmentConfig,
) -> Result<()> {
    let start = Instant::now();
    debug!(
        "waiting for account existence: account={}, timeout_ms={}, interval_ms={}",
        account,
        timeout.as_millis(),
        interval.as_millis()
    );

    while start.elapsed() < timeout {
        if get_account_opt(client, account, commitment)?.is_some() {
            debug!("account is now visible: account={}", account);
            return Ok(());
        }
        sleep(interval);
    }

    bail!("timeout waiting for account {} to exist", account)
}

pub(crate) fn account_owner_is(
    client: &RpcClient,
    account: &Pubkey,
    expected_owner: &Pubkey,
    commitment: CommitmentConfig,
) -> Result<bool> {
    Ok(get_account_opt(client, account, commitment)?
        .map(|a| a.owner == *expected_owner)
        .unwrap_or(false))
}

pub(crate) fn get_account_opt(
    client: &RpcClient,
    address: &Pubkey,
    commitment: CommitmentConfig,
) -> Result<Option<solana_sdk::account::Account>> {
    debug!("rpc get_account_with_commitment: account={address}, commitment={commitment:?}");
    let response = client
        .get_account_with_commitment(address, commitment)
        .with_context(|| format!("failed to fetch account {address}"))?;
    debug!(
        "rpc get_account_with_commitment response: account={}, exists={}",
        address,
        response.value.is_some()
    );
    Ok(response.value)
}

pub(crate) fn fetch_deposit_amount(
    client: &RpcClient,
    address: &Pubkey,
    commitment: CommitmentConfig,
) -> Result<Option<u64>> {
    debug!("fetch_deposit_amount: account={address}");
    let Some(account) = get_account_opt(client, address, commitment)? else {
        return Ok(None);
    };
    if !is_deposit_state_owner(&account.owner) {
        debug!(
            "fetch_deposit_amount skip: account={}, unexpected_owner={}",
            address, account.owner
        );
        return Ok(None);
    }
    let parsed = decode_deposit_account(&account.data)?;
    debug!("fetch_deposit_amount result: account={}, amount={}", address, parsed.amount);
    Ok(Some(parsed.amount))
}

pub(crate) fn fetch_username_deposit_amount(
    client: &RpcClient,
    address: &Pubkey,
    commitment: CommitmentConfig,
) -> Result<Option<u64>> {
    debug!("fetch_username_deposit_amount: account={address}");
    let Some(account) = get_account_opt(client, address, commitment)? else {
        return Ok(None);
    };
    if !is_deposit_state_owner(&account.owner) {
        debug!(
            "fetch_username_deposit_amount skip: account={}, unexpected_owner={}",
            address, account.owner
        );
        return Ok(None);
    }
    let parsed = decode_username_deposit_account(&account.data)?;
    debug!(
        "fetch_username_deposit_amount result: account={}, amount={}",
        address, parsed.amount
    );
    Ok(Some(parsed.amount))
}

fn is_deposit_state_owner(owner: &Pubkey) -> bool {
    *owner == program_id() || *owner == delegation_program_id()
}

fn decode_deposit_account(data: &[u8]) -> Result<DepositAccountData> {
    if data.len() < 8 + 32 + 32 + 8 {
        bail!("deposit account data too short");
    }
    if data[..8] != DEPOSIT_DISCRIMINATOR {
        bail!("invalid deposit discriminator");
    }
    let amount_offset = 8 + 32 + 32;
    let amount = u64::from_le_bytes(
        data[amount_offset..amount_offset + 8]
            .try_into()
            .context("invalid deposit amount bytes")?,
    );
    Ok(DepositAccountData { amount })
}

fn decode_username_deposit_account(data: &[u8]) -> Result<UsernameDepositAccountData> {
    if data.len() < 8 + 4 + 32 + 8 {
        bail!("username deposit account data too short");
    }
    if data[..8] != USERNAME_DEPOSIT_DISCRIMINATOR {
        bail!("invalid username deposit discriminator");
    }

    let username_len =
        u32::from_le_bytes(data[8..12].try_into().context("invalid username length")?) as usize;
    let amount_offset = 12 + username_len + 32;
    if data.len() < amount_offset + 8 {
        bail!("username deposit account malformed");
    }

    let amount = u64::from_le_bytes(
        data[amount_offset..amount_offset + 8]
            .try_into()
            .context("invalid username deposit amount bytes")?,
    );

    Ok(UsernameDepositAccountData { amount })
}

pub(crate) fn send_ix(client: &RpcClient, payer: &Keypair, instruction: Instruction) -> Result<Signature> {
    debug!(
        "rpc send transaction: program_id={}, account_count={}, signer={}",
        instruction.program_id,
        instruction.accounts.len(),
        payer.pubkey()
    );
    let blockhash = client
        .get_latest_blockhash()
        .context("failed to fetch blockhash")?;
    let tx = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&payer.pubkey()),
        &[payer],
        blockhash,
    );
    let signature = client
        .send_and_confirm_transaction(&tx)
        .context("failed to send transaction")?;
    debug!("rpc send transaction confirmed: signature={signature}");
    Ok(signature)
}

pub(crate) fn ensure_ata_exists(
    client: &RpcClient,
    payer: &Keypair,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Result<()> {
    let ata = get_associated_token_address_with_program_id(owner, mint, &spl_token::id());
    debug!(
        "ensure_ata_exists: owner={}, mint={}, ata={}",
        owner, mint, ata
    );
    if get_account_opt(client, &ata, CommitmentConfig::confirmed())?.is_some() {
        return Ok(());
    }

    let ix =
        create_associated_token_account_idempotent(&payer.pubkey(), owner, mint, &spl_token::id());
    let _ = send_ix(client, payer, ix)?;
    Ok(())
}

pub(crate) fn wrap_sol_to_wsol(
    client: &RpcClient,
    payer: &Keypair,
    wsol_ata: &Pubkey,
    lamports: u64,
) -> Result<bool> {
    debug!("wrap_sol_to_wsol: ata={}, lamports={}", wsol_ata, lamports);
    let owner = payer.pubkey();
    let mut ixs = Vec::new();

    let exists = get_account_opt(client, wsol_ata, CommitmentConfig::confirmed())?.is_some();
    if !exists {
        ixs.push(create_associated_token_account_idempotent(
            &owner,
            &owner,
            &native_mint_id(),
            &spl_token::id(),
        ));
    }

    ixs.push(system_instruction::transfer(&owner, wsol_ata, lamports));
    ixs.push(token_instruction::sync_native(&spl_token::id(), wsol_ata)?);

    let blockhash = client
        .get_latest_blockhash()
        .context("failed to fetch blockhash")?;
    let tx = Transaction::new_signed_with_payer(&ixs, Some(&owner), &[payer], blockhash);
    client
        .send_and_confirm_transaction(&tx)
        .context("failed to wrap SOL into wSOL")?;

    Ok(!exists)
}

pub(crate) fn close_wsol_ata(client: &RpcClient, payer: &Keypair, wsol_ata: &Pubkey) -> Result<()> {
    debug!("close_wsol_ata: ata={}", wsol_ata);
    let ix = token_instruction::close_account(
        &spl_token::id(),
        wsol_ata,
        &payer.pubkey(),
        &payer.pubkey(),
        &[],
    )?;
    let _ = send_ix(client, payer, ix)?;
    Ok(())
}

pub(crate) fn print_signature(output: OutputFormat, signature: Signature) -> Result<()> {
    match output {
        OutputFormat::Display => {
            println!("Signature: {}", signature);
        }
        OutputFormat::Json => {
            println!(
                "{}",
                serde_json::to_string_pretty(&json!({ "signature": signature.to_string() }))?
            );
        }
        OutputFormat::JsonCompact => {
            println!(
                "{}",
                serde_json::to_string(&json!({ "signature": signature.to_string() }))?
            );
        }
    }
    Ok(())
}
