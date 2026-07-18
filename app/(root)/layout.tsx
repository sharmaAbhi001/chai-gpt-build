import React from "react";
import { auth } from "@clerk/nextjs/server";
import { onBoard } from "@/features/auth/action/onboard";
import { ChatShell } from "@/features/conversation/component/chat-shell";
import { Toaster } from "@/components/ui/sonner";

const RootGroupLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await auth.protect();
  await onBoard();

  return (
    <ChatShell>
      {children}
      <Toaster />
    </ChatShell>
  );
};

export default RootGroupLayout;
