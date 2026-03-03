/**
 * Feature flag for Skills activation
 * Controls whether the Skills feature (slash commands for Swap/Send) is enabled
 *
 * Set NEXT_PUBLIC_SKILLS_ENABLED=false in .env to disable Skills
 */
export function isSkillsEnabled(): boolean {
  // Check environment variable (must use NEXT_PUBLIC_ prefix for client-side access)
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SKILLS_ENABLED !== undefined
  ) {
    return process.env.NEXT_PUBLIC_SKILLS_ENABLED === "true";
  }

  // Default: enabled
  return true;
}
