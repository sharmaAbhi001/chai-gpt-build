'use server'
import { cache } from "react";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const onBoard = cache(async () => {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        throw new Error("Unauthorised")
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    return prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        create: {
            clerkId: clerkUser.id,
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        },
        update: {
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        }
    })
})
