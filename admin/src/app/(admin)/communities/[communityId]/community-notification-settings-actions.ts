"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { CACHE_TAGS, communityTag } from "@/lib/data-cache"
import { db } from "@/lib/db"
import { communities } from "@/lib/generated/schema"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const PER_DAY_VALUES = new Set(["off", "24", "48"])
const PER_MESSAGE_VALUES = new Set(["off", "500", "1000"])

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : "off"
}

export async function updateCommunityNotificationSettings(
  communityId: string,
  formData: FormData
) {
  if (!UUID_PATTERN.test(communityId)) {
    return
  }

  const perDay = getFormValue(formData, "perDay")
  const perMessage = getFormValue(formData, "perMessage")
  const isMasterEnabled = formData.get("masterSwitch") === "on"
  const isActive = formData.get("isActive") === "on"
  const isPublic = formData.get("isPublic") === "on"

  if (!PER_DAY_VALUES.has(perDay) || !PER_MESSAGE_VALUES.has(perMessage)) {
    return
  }

  await db
    .update(communities)
    .set({
      summaryNotificationsEnabled: isActive ? isMasterEnabled : false,
      summaryNotificationTimeHours: perDay === "off" ? null : Number(perDay),
      summaryNotificationMessageCount: perMessage === "off" ? null : Number(perMessage),
      isActive,
      isPublic,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(communities.id, communityId))

  revalidateTag(communityTag(communityId))
  revalidateTag(CACHE_TAGS.communitiesList)
  revalidateTag(CACHE_TAGS.overview)
  revalidatePath(`/communities/${communityId}`)
}
