import { GridClient } from "@sqds/grid";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { createInterface } from "node:readline/promises";
import fs from "node:fs";
import path from "node:path";

type CliOptions = {
  email?: string;
  otp?: string;
  to?: string;
  lamports: number;
  environment: "sandbox" | "production";
  authProvider: "privy" | "turnkey";
  rpcUrl?: string;
  baseUrl: string;
  feeCurrency: "sol" | "usdc" | "usdt" | "pyusd" | "eurc";
  feePayer?: string;
  perSignerKeypair?: string;
  selfManagedFees: boolean;
  skipSubmit: boolean;
};

const DEFAULT_BASE_URL = "https://grid.squads.xyz";
const DEFAULT_SANDBOX_RPC = "https://api.devnet.solana.com";
const DEFAULT_PRODUCTION_RPC = "https://api.mainnet-beta.solana.com";

const usage = () => {
  console.log(`Create Squads account, sign a tx with Squads, and optionally submit it.

Usage:
  bun scripts/squads-grid-create-sign-submit.ts --email <email> [options]

Options:
  --email <email>            Email used for Squads OTP account creation (required)
  --otp <code>               OTP code (if omitted, prompt in terminal)
  --to <pubkey>              Recipient for SystemProgram.transfer (default: self)
  --lamports <number>        Transfer amount in lamports (default: 1000)
  --environment <env>        sandbox|production (default: sandbox)
  --auth-provider <provider> privy|turnkey for existing-account auth (default: privy)
  --rpc-url <url>            Solana RPC URL used to build transaction
  --base-url <url>           Squads Grid base URL (default: https://grid.squads.xyz)
  --fee-currency <currency>  sol|usdc|usdt|pyusd|eurc (default: sol)
  --fee-payer <pubkey>       Fee payer address (default: created account address)
  --per-signer-keypair <path>  Local JSON keypair file used to sign for PER before Squads sign
  --self-managed-fees        Include selfManagedFees=true in fee config
  --skip-submit              Only sign (do not call submit/send)
  --help                     Show this help

Env loading:
  - Reads SQUADS_GRID_API_KEY from app/.env first, then process.env.
  - If present, NEXT_PUBLIC_SOLANA_RPC_URL in app/.env is used as default RPC.
  - Optional PER_SIGNER_KEYPAIR points to a local JSON keypair file.
`);
};

const parseEnvFile = (envPath: string): Record<string, string> => {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const file = fs.readFileSync(envPath, "utf8");
  const result: Record<string, string> = {};

  for (const rawLine of file.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) {
      continue;
    }

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
};

const parseArgs = (argv: string[]): CliOptions | null => {
  const options: CliOptions = {
    lamports: 1000,
    environment: "sandbox",
    authProvider: "privy",
    baseUrl: DEFAULT_BASE_URL,
    feeCurrency: "sol",
    selfManagedFees: false,
    skipSubmit: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "--email":
        options.email = argv[++i];
        break;
      case "--otp":
        options.otp = argv[++i];
        break;
      case "--to":
        options.to = argv[++i];
        break;
      case "--lamports":
        options.lamports = Number(argv[++i] ?? "1000");
        break;
      case "--environment": {
        const env = argv[++i];
        if (env !== "sandbox" && env !== "production") {
          throw new Error(
            `Invalid --environment "${env}". Use "sandbox" or "production".`
          );
        }
        options.environment = env;
        break;
      }
      case "--auth-provider": {
        const provider = argv[++i];
        if (provider !== "privy" && provider !== "turnkey") {
          throw new Error(
            `Invalid --auth-provider "${provider}". Use "privy" or "turnkey".`
          );
        }
        options.authProvider = provider;
        break;
      }
      case "--rpc-url":
        options.rpcUrl = argv[++i];
        break;
      case "--base-url":
        options.baseUrl = argv[++i] ?? DEFAULT_BASE_URL;
        break;
      case "--fee-currency": {
        const feeCurrency = argv[++i];
        if (
          feeCurrency !== "sol" &&
          feeCurrency !== "usdc" &&
          feeCurrency !== "usdt" &&
          feeCurrency !== "pyusd" &&
          feeCurrency !== "eurc"
        ) {
          throw new Error(
            `Invalid --fee-currency "${feeCurrency}". Use sol|usdc|usdt|pyusd|eurc.`
          );
        }
        options.feeCurrency = feeCurrency;
        break;
      }
      case "--fee-payer":
        options.feePayer = argv[++i];
        break;
      case "--per-signer-keypair":
        options.perSignerKeypair = argv[++i];
        break;
      case "--self-managed-fees":
        options.selfManagedFees = true;
        break;
      case "--skip-submit":
        options.skipSubmit = true;
        break;
      case "--help":
      case "-h":
        usage();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.lamports) || options.lamports <= 0) {
    throw new Error("--lamports must be a positive number");
  }

  return options;
};

const resolvePath = (filePath: string): string => {
  if (!filePath.startsWith("~")) {
    return filePath;
  }

  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (!homeDir) {
    throw new Error(
      `Cannot resolve "~" in path "${filePath}" because HOME is not set`
    );
  }

  return path.join(homeDir, filePath.slice(1));
};

const loadKeypair = (filePath: string): Keypair => {
  const resolvedPath = resolvePath(filePath);
  const raw = JSON.parse(fs.readFileSync(resolvedPath, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
};

const isEmailAlreadyExistsError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("email") && message.includes("already exists");
};

const promptForOtp = async (): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const code = (await rl.question("Enter OTP code from email: ")).trim();
    if (!code) {
      throw new Error("OTP code is required");
    }
    return code;
  } finally {
    rl.close();
  }
};

const buildUnsignedTransferBase64 = async (
  accountAddress: string,
  recipientAddress: string,
  lamports: number,
  rpcUrl: string
): Promise<string> => {
  const connection = new Connection(rpcUrl, "confirmed");
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const payer = new PublicKey(accountAddress);
  const to = new PublicKey(recipientAddress);

  const instruction = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: to,
    lamports,
  });

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [instruction],
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  return Buffer.from(tx.serialize()).toString("base64");
};

const getRequiredSignerAddresses = (tx: VersionedTransaction): string[] => {
  const requiredSignatures = tx.message.header.numRequiredSignatures;
  return tx.message.staticAccountKeys
    .slice(0, requiredSignatures)
    .map((key) => key.toBase58());
};

const run = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    return;
  }

  const appEnvPath = path.resolve(process.cwd(), "app/.env");
  const appEnv = parseEnvFile(appEnvPath);

  const apiKey = process.env.SQUADS_GRID_API_KEY ?? appEnv.SQUADS_GRID_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing SQUADS_GRID_API_KEY. Set it in app/.env or process environment."
    );
  }

  const email = options.email;
  if (!email) {
    throw new Error("--email is required");
  }

  const rpcUrl =
    options.rpcUrl ??
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    appEnv.NEXT_PUBLIC_SOLANA_RPC_URL ??
    (options.environment === "production"
      ? DEFAULT_PRODUCTION_RPC
      : DEFAULT_SANDBOX_RPC);
  const perSignerPath =
    options.perSignerKeypair ??
    process.env.PER_SIGNER_KEYPAIR ??
    appEnv.PER_SIGNER_KEYPAIR;
  const perSigner = perSignerPath ? loadKeypair(perSignerPath) : undefined;
  const perSignerAddress = perSigner?.publicKey.toBase58();
  const totalSteps = perSigner ? 7 : 6;

  const grid = new GridClient({
    apiKey,
    environment: options.environment,
    baseUrl: options.baseUrl,
  });

  console.log(
    `[1/${totalSteps}] Generating session secrets (${options.environment}) and requesting OTP for ${email}`
  );
  const sessionSecrets = await grid.generateSessionSecrets();

  let authMode: "create" | "existing" = "create";
  let existingAccountOtpId: string | undefined;
  try {
    await grid.createAccount({ email });
  } catch (error: unknown) {
    if (!isEmailAlreadyExistsError(error)) {
      throw error;
    }

    authMode = "existing";
    console.log(
      `Email already exists in Grid, switching to existing-account auth (${options.authProvider})`
    );

    const initAuth = await grid.initAuth({
      email,
      provider: options.authProvider,
    });
    if ("otpId" in initAuth.data) {
      existingAccountOtpId = initAuth.data.otpId;
    }
  }

  const otpCode = options.otp ?? (await promptForOtp());

  let accountAddress: string;
  let authentication: unknown[];
  if (authMode === "create") {
    console.log(`[2/${totalSteps}] Completing auth + creating account`);
    const createdAccount = await grid.completeAuthAndCreateAccount({
      otpCode,
      user: { email },
      sessionSecrets,
    });
    accountAddress = createdAccount.data.address;
    authentication = createdAccount.data.authentication;
    console.log(`Created account: ${accountAddress}`);
  } else {
    console.log(`[2/${totalSteps}] Completing auth for existing account`);
    const existingAccount = await grid.completeAuth({
      otpCode,
      user: {
        email,
        provider: options.authProvider,
        otpId: existingAccountOtpId,
      },
      sessionSecrets,
    });
    accountAddress = existingAccount.data.address;
    authentication = existingAccount.data.authentication;
    console.log(`Authenticated account: ${accountAddress}`);
  }

  const recipient = options.to ?? accountAddress;
  const feePayer = options.feePayer ?? accountAddress;
  const accountSigners = perSignerAddress
    ? [accountAddress, perSignerAddress]
    : [accountAddress];

  console.log(
    `[3/${totalSteps}] Building unsigned transfer transaction (lamports=${options.lamports}, to=${recipient})`
  );
  const unsignedBase64 = await buildUnsignedTransferBase64(
    accountAddress,
    recipient,
    options.lamports,
    rpcUrl
  );

  console.log(
    `[4/${totalSteps}] Preparing transaction payload with Squads Grid`
  );
  const prepared = await grid.prepareArbitraryTransaction(accountAddress, {
    transaction: unsignedBase64,
    accountSigners,
    feeConfig: {
      currency: options.feeCurrency,
      payerAddress: feePayer,
      ...(options.selfManagedFees ? { selfManagedFees: true } : {}),
    },
  });

  let payloadForGridSign = prepared.data;
  if (perSigner) {
    console.log("[5/7] Signing transaction locally for PER");
    const signableTransaction = grid.extractSignableTransaction(prepared.data);
    const requiredSigners = getRequiredSignerAddresses(signableTransaction);
    if (!perSignerAddress || !requiredSigners.includes(perSignerAddress)) {
      throw new Error(
        `PER signer ${perSignerAddress} is not required by the prepared transaction. Required signers: ${requiredSigners.join(
          ", "
        )}`
      );
    }

    signableTransaction.sign([perSigner]);
    payloadForGridSign = grid.setExternallySignedTransaction(
      prepared.data,
      signableTransaction
    );
    console.log(`Applied local PER signature: ${perSignerAddress}`);
  }

  console.log(
    perSigner
      ? "[6/7] Signing transaction with Squads"
      : "[5/6] Signing transaction with Squads"
  );
  const signed = await grid.sign({
    sessionSecrets,
    session: authentication,
    transactionPayload: payloadForGridSign,
  });
  console.log(`Signed payload providers: ${signed.kmsPayloads.length}`);

  if (options.skipSubmit) {
    console.log(
      "Skipping submit as requested (--skip-submit). Signing flow completed."
    );
    return;
  }

  console.log(
    perSigner
      ? "[7/7] Submitting transaction with Squads submit endpoint"
      : "[6/6] Submitting transaction with Squads submit endpoint"
  );
  const submitted = await grid.send({
    address: accountAddress,
    signedTransactionPayload: signed,
  });

  console.log(
    "Submitted transaction signature:",
    submitted.data.transactionSignature
  );
  console.log("Confirmed at:", submitted.data.confirmedAt);
};

run().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown error during Squads flow";
  console.error("Script failed:", message);
  process.exit(1);
});
