'use server'
import { auth } from "@clerk/nextjs/server";
import { onBoard } from "@/features/auth/action/onboard";

export async function requireUser() {
    await auth.protect();
    return onBoard();
}
