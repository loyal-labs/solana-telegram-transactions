"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { admins } from "@/lib/generated/schema";

export async function addAdmin(formData: FormData) {
  const telegramId = formData.get("telegramId") as string;
  const displayName = formData.get("displayName") as string;
  const username = (formData.get("username") as string) || null;
  const addedBy = (formData.get("addedBy") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!telegramId || !displayName) {
    return { error: "Telegram ID and Display Name are required" };
  }

  try {
    await db.insert(admins).values({
      telegramId: Number(telegramId),
      displayName,
      username,
      addedBy,
      notes,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("unique")) {
      return { error: "An admin with this Telegram ID already exists" };
    }
    return { error: "Failed to add admin" };
  }

  revalidatePath("/admins");
  return { success: true };
}

export async function updateAdmin(id: string, formData: FormData) {
  const telegramId = formData.get("telegramId") as string;
  const displayName = formData.get("displayName") as string;
  const username = (formData.get("username") as string) || null;
  const addedBy = (formData.get("addedBy") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!telegramId || !displayName) {
    return { error: "Telegram ID and Display Name are required" };
  }

  try {
    await db
      .update(admins)
      .set({
        telegramId: Number(telegramId),
        displayName,
        username,
        addedBy,
        notes,
      })
      .where(eq(admins.id, id));
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("unique")) {
      return { error: "An admin with this Telegram ID already exists" };
    }
    return { error: "Failed to update admin" };
  }

  revalidatePath("/admins");
  return { success: true };
}

export async function deleteAdmin(id: string) {
  await db.delete(admins).where(eq(admins.id, id));
  revalidatePath("/admins");
  return { success: true };
}
