import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { Solita } from "@metaplex-foundation/solita";
import {
  IGNORED_IDL_TYPES,
  REQUIRED_ACCOUNTS,
  REQUIRED_INSTRUCTIONS,
  findOperationCoverageIssues,
} from "../sdk/loyal-smart-accounts-core/src/spec/index.ts";

type SmartAccountIdl = {
  address?: string;
  instructions?: Array<{ name: string }>;
  accounts?: Array<{ name: string }>;
  types?: Array<{ name: string }>;
};

type SyncOptions = {
  repoUrl: string;
  ref?: string;
  upstreamDir?: string;
  allowProgramIdChange?: boolean;
  check?: boolean;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const PACKAGE_DIR = resolve(ROOT_DIR, "sdk/loyal-smart-accounts-core");
const PUBLIC_PACKAGE_DIR = resolve(ROOT_DIR, "sdk/loyal-smart-accounts");
const RAW_IDL_PATH = join(
  PACKAGE_DIR,
  "upstream/raw/squads_smart_account_program.json"
);
const NORMALIZED_IDL_PATH = join(
  PACKAGE_DIR,
  "upstream/normalized/squads_smart_account_program.json"
);
const MANIFEST_PATH = join(PACKAGE_DIR, "upstream/manifest.json");
const GENERATED_DIR = join(PACKAGE_DIR, "src/generated");
const DEFAULT_REPO_URL =
  "https://github.com/Squads-Protocol/smart-account-program";
const UPSTREAM_IDL_PATH = "sdk/smart-account/idl/squads_smart_account_program.json";
const UPSTREAM_SOLITA_CONFIG_PATH = "sdk/smart-account/.solitarc.js";
const UPSTREAM_PROGRAM_LIB_PATH =
  "programs/squads_smart_account_program/src/lib.rs";

const IGNORED_TYPES = new Set<string>(IGNORED_IDL_TYPES);

export function normalizeSmartAccountIdl<T>(idl: T): T {
  const transform = (value: unknown): unknown => {
    if (value === "SmallVec<u16,u8>") {
      return "bytes";
    }

    if (Array.isArray(value)) {
      return value.map((entry) => transform(entry));
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (record.defined === "SmallVec<u16,u8>") {
        return "bytes";
      }

      const next: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(record)) {
        next[key] = transform(nested);
      }
      return next;
    }

    return value;
  };

  const normalized = transform(idl) as SmartAccountIdl;
  if (Array.isArray(normalized.types)) {
    normalized.types = normalized.types.filter(
      (entry) => !IGNORED_TYPES.has(entry.name)
    );
  }

  return normalized as T;
}

export function parseProgramIdFromLibRs(source: string): string {
  const match = source.match(/declare_id!\("([^"]+)"\);/);
  const programId = match?.[1];
  if (!programId) {
    throw new Error("Unable to parse program id from lib.rs");
  }
  return programId;
}

export function parseProgramIdFromSolitaConfig(source: string): string {
  const match = source.match(/programId:\s*"([^"]+)"/);
  const programId = match?.[1];
  if (!programId) {
    throw new Error("Unable to parse program id from .solitarc.js");
  }
  return programId;
}

export function validateIdlSurface(idl: SmartAccountIdl): void {
  const instructionNames = new Set(
    (idl.instructions ?? []).map((instruction) => instruction.name)
  );
  const accountNames = new Set((idl.accounts ?? []).map((account) => account.name));

  const missingInstructions = REQUIRED_INSTRUCTIONS.filter(
    (name) => !instructionNames.has(name)
  );
  const missingAccounts = REQUIRED_ACCOUNTS.filter((name) => !accountNames.has(name));

  if (missingInstructions.length > 0) {
    throw new Error(
      `Upstream IDL is missing required instructions: ${missingInstructions.join(", ")}`
    );
  }

  if (missingAccounts.length > 0) {
    throw new Error(
      `Upstream IDL is missing required accounts: ${missingAccounts.join(", ")}`
    );
  }
}

function assertFeatureCoverage(): void {
  const issues = findOperationCoverageIssues();
  if (issues.missingMappings.length === 0 && issues.duplicateExports.length === 0) {
    return;
  }

  throw new Error(
    `Feature coverage validation failed: missing=[${issues.missingMappings.join(
      ", "
    )}] duplicateExports=[${issues.duplicateExports.join(", ")}]`
  );
}

function assertRuntimeBindingCoverage(): void {
  execFileSync(
    "bun",
    ["run", "--cwd", PUBLIC_PACKAGE_DIR, "validate:surface"],
    {
      stdio: "inherit",
    }
  );
}

function parseArgs(argv: string[]): SyncOptions {
  const options: SyncOptions = {
    repoUrl: DEFAULT_REPO_URL,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--repo" && next) {
      options.repoUrl = next;
      index += 1;
      continue;
    }
    if (current === "--ref" && next) {
      options.ref = next;
      index += 1;
      continue;
    }
    if (current === "--upstream-dir" && next) {
      options.upstreamDir = resolve(next);
      index += 1;
      continue;
    }
    if (current === "--allow-program-id-change") {
      options.allowProgramIdChange = true;
      continue;
    }
    if (current === "--check") {
      options.check = true;
    }
  }

  return options;
}

function resolveUpstreamDirectory(options: SyncOptions): string {
  if (options.upstreamDir) {
    return options.upstreamDir;
  }

  const cloneDir = join(
    tmpdir(),
    `loyal-smart-accounts-${Date.now().toString(36)}`
  );
  execFileSync("git", ["clone", "--depth=1", options.repoUrl, cloneDir], {
    stdio: "inherit",
  });
  if (options.ref) {
    execFileSync("git", ["-C", cloneDir, "fetch", "--depth=1", "origin", options.ref], {
      stdio: "inherit",
    });
    execFileSync("git", ["-C", cloneDir, "checkout", options.ref], {
      stdio: "inherit",
    });
  }
  return cloneDir;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function normalizeText(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function assertOrWriteFile(args: {
  path: string;
  content: string;
  check?: boolean;
}): void {
  const normalizedContent = normalizeText(args.content);
  const existingContent = existsSync(args.path)
    ? readFileSync(args.path, "utf8")
    : null;

  if (args.check) {
    if (existingContent !== normalizedContent) {
      throw new Error(`Drift detected for ${args.path}`);
    }
    return;
  }

  writeFileSync(args.path, normalizedContent, "utf8");
}

function collectFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root, { recursive: true })
    .filter((entry) => {
      const fullPath = join(root, entry);
      return statSync(fullPath).isFile();
    })
    .map((entry) => entry.toString())
    .sort();
}

function assertOrReplaceDirectory(args: {
  targetDir: string;
  sourceDir: string;
  check?: boolean;
}): void {
  const targetFiles = collectFiles(args.targetDir);
  const sourceFiles = collectFiles(args.sourceDir);

  if (args.check) {
    if (targetFiles.length !== sourceFiles.length) {
      throw new Error(`Generated output drift detected in ${args.targetDir}`);
    }

    for (let index = 0; index < sourceFiles.length; index += 1) {
      if (targetFiles[index] !== sourceFiles[index]) {
        throw new Error(`Generated output drift detected in ${args.targetDir}`);
      }

      const targetContent = readFileSync(
        join(args.targetDir, targetFiles[index]),
        "utf8"
      );
      const sourceContent = readFileSync(
        join(args.sourceDir, sourceFiles[index]),
        "utf8"
      );

      if (targetContent !== sourceContent) {
        throw new Error(`Generated output drift detected in ${args.targetDir}`);
      }
    }

    return;
  }

  rmSync(args.targetDir, { recursive: true, force: true });
  mkdirSync(dirname(args.targetDir), { recursive: true });

  for (const relativePath of sourceFiles) {
    const destinationPath = join(args.targetDir, relativePath);
    mkdirSync(dirname(destinationPath), { recursive: true });
    writeFileSync(
      destinationPath,
      readFileSync(join(args.sourceDir, relativePath), "utf8"),
      "utf8"
    );
  }
}

export async function syncFromUpstream(options: SyncOptions): Promise<{
  commitSha: string;
  programId: string;
}> {
  const upstreamDir = resolveUpstreamDirectory(options);
  const rawIdlPath = join(upstreamDir, UPSTREAM_IDL_PATH);
  const solitaConfigPath = join(upstreamDir, UPSTREAM_SOLITA_CONFIG_PATH);
  const programLibPath = join(upstreamDir, UPSTREAM_PROGRAM_LIB_PATH);
  const upstreamPackageJsonPath = join(upstreamDir, "sdk/smart-account/package.json");

  const rawIdl = readJson<SmartAccountIdl>(rawIdlPath);
  const normalizedIdl = normalizeSmartAccountIdl(rawIdl);
  validateIdlSurface(normalizedIdl);

  const libProgramId = parseProgramIdFromLibRs(readFileSync(programLibPath, "utf8"));
  const solitaProgramId = parseProgramIdFromSolitaConfig(
    readFileSync(solitaConfigPath, "utf8")
  );
  const idlProgramId = normalizedIdl.address ?? solitaProgramId;
  const programId = idlProgramId;

  if (libProgramId !== programId || solitaProgramId !== programId) {
    throw new Error(
      `Upstream program id mismatch: lib.rs=${libProgramId}, solita=${solitaProgramId}, idl=${idlProgramId}`
    );
  }

  const currentManifest = existsSync(MANIFEST_PATH)
    ? readJson<{ programId: string; fetchedAt?: string }>(MANIFEST_PATH)
    : null;
  if (
    currentManifest &&
    currentManifest.programId !== programId &&
    !options.allowProgramIdChange
  ) {
    throw new Error(
      `Program id changed from ${currentManifest.programId} to ${programId}. Re-run with --allow-program-id-change if intended.`
    );
  }

  mkdirSync(join(PACKAGE_DIR, "upstream/raw"), { recursive: true });
  mkdirSync(join(PACKAGE_DIR, "upstream/normalized"), { recursive: true });

  const commitSha = execFileSync("git", ["-C", upstreamDir, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const upstreamPackage = readJson<{ name: string; version: string }>(
    upstreamPackageJsonPath
  );
  const manifest = {
    repoUrl: options.repoUrl,
    commitSha,
    fetchedAt:
      options.check && currentManifest?.fetchedAt
        ? currentManifest.fetchedAt
        : new Date().toISOString().slice(0, 10),
    sourceIdlPath: UPSTREAM_IDL_PATH,
    sourceProgramLibPath: UPSTREAM_PROGRAM_LIB_PATH,
    sourceSolitaConfigPath: UPSTREAM_SOLITA_CONFIG_PATH,
    normalizedIdlPath: "upstream/normalized/squads_smart_account_program.json",
    generatedFromNormalizedIdl: true,
    generator: "@metaplex-foundation/solita@0.20.0",
    programId,
    upstreamPackageName: upstreamPackage.name,
    upstreamPackageVersion: upstreamPackage.version,
  };

  assertOrWriteFile({
    path: RAW_IDL_PATH,
    content: JSON.stringify(rawIdl, null, 2),
    check: options.check,
  });
  assertOrWriteFile({
    path: NORMALIZED_IDL_PATH,
    content: JSON.stringify(normalizedIdl, null, 2),
    check: options.check,
  });
  assertOrWriteFile({
    path: MANIFEST_PATH,
    content: JSON.stringify(manifest, null, 2),
    check: options.check,
  });

  const tempGeneratedDir = join(
    tmpdir(),
    `loyal-smart-accounts-generated-${Date.now().toString(36)}`
  );
  const generator = new Solita(normalizedIdl as any, {
    formatCode: true,
  });
  await generator.renderAndWriteTo(tempGeneratedDir);

  assertOrReplaceDirectory({
    targetDir: GENERATED_DIR,
    sourceDir: tempGeneratedDir,
    check: options.check,
  });

  assertFeatureCoverage();
  assertRuntimeBindingCoverage();

  return {
    commitSha,
    programId,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await syncFromUpstream(options);
  console.log(
    `${options.check ? "Validated" : "Updated"} loyal-smart-accounts from ${options.repoUrl} at ${result.commitSha} (${result.programId})`
  );
}

if (import.meta.main) {
  await main();
}
