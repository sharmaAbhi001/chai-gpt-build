"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useDeleteConversation,
  useUpdateConversation,
} from "../hooks/use-conversation";



type Conversation = NonNullable<
  ReturnType<typeof useConversations>["data"]
>[number];


export function AppSidebar() {
    const pathname = usePathname();
    const {data:conversations,isLoading} = useConversations();

    const activeId = pathname.startsWith("/c/")
    ? pathname.split("/")[2]
    :undefined


    return (
        <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="font-semibold tracking-tight"
                render={<Link href="/" />}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
                  C
                </span>
                <span>ChaiGPT</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="New chat" render={<Link href="/" />}>
                <PlusIcon />
                <span>New chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
  
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <ChatList
                  conversations={conversations}
                  isLoading={isLoading}
                  activeId={activeId}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
  
        <SidebarFooter>
          <SidebarFooterMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )

}



function ChatList({
    conversations,
    isLoading,
    activeId,
  }: {
    conversations: Conversation[] | undefined;
    isLoading: boolean;
    activeId: string | undefined;
  }) {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 5 }).map((_, index) => (
            <SidebarMenuItem key={index}>
              <Skeleton className="h-8 w-full" />
            </SidebarMenuItem>
          ))}
        </>
      );
    }
  
    if (!conversations?.length) {
      return (
        <p className="px-2 py-1.5 text-xs text-muted-foreground">No chats yet</p>
      );
    }
  
    return (
      <>
        {conversations.map((conversation) => (
          <ChatItem
            key={conversation.id}
            conversation={conversation}
            isActive={activeId === conversation.id}
          />
        ))}
      </>
    );
  }
  
  /** Single sidebar row for a conversation with rename, pin, and delete actions. */
  function ChatItem({
    conversation,
    isActive,
  }: {
    conversation: Conversation;
    isActive: boolean;
  }) {
    const updateConversation = useUpdateConversation();
    const deleteConversation = useDeleteConversation(
      isActive ? conversation.id : undefined
    );
  
    /** Prompts the user to rename the conversation and persists the new title. */
    function handleRename() {
      const next = window.prompt("Rename chat", conversation.title);
      if (!next || next.trim() === conversation.title) return;
      updateConversation.mutate({ id: conversation.id, title: next });
    }
  
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={conversation.title}
          render={<Link href={`/c/${conversation.id}`} />}
          className={cn(isActive && "font-medium")}
        >
          <span className="truncate">{conversation.title}</span>
        </SidebarMenuButton>
  
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuAction
                showOnHover
                className="data-popup-open:bg-sidebar-accent"
              />
            }
          >
            <MoreHorizontalIcon/>
            <span className="sr-only">Chat actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem onClick={handleRename}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                updateConversation.mutate({
                  id: conversation.id,
                  isPinned: !conversation.isPinned,
                })
              }
            >
              {conversation.isPinned ? <PinOffIcon /> : <PinIcon />}
              {conversation.isPinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => deleteConversation.mutate(conversation.id)}
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }
  
  /** Footer menu with theme toggle and Clerk user account button. */
  function SidebarFooterMenu() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            Toggle theme
          </Button>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-1 py-1.5">
            {mounted ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-8",
                  },
                }}
              />
            ) : (
              <div className="size-8 shrink-0 rounded-full bg-muted" />
            )}
            <span className="truncate text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
              Account
            </span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }