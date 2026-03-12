import { getPublicEnv } from "@/lib/core/config/public";

/**
 * Feature flag for Skills activation
 * Controls whether the Skills feature (slash commands for Swap/Send) is enabled
 *
 * Set NEXT_PUBLIC_SKILLS_ENABLED=false in .env to disable Skills
 */
export function isSkillsEnabled(): boolean {
  return getPublicEnv().skillsEnabled;
}
