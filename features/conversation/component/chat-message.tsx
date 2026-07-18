"use client";

import * as React from "react";
import { isTextUIPart, type ChatStatus, type UIMessage } from "ai";

import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Spinner } from "@/components/ui/spinner";

/** Extracts plain text from a `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
};

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";
  const isStreaming = status === "streaming";

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const stickToBottomRef = React.useRef(true);

  /** Keep following the bottom unless the user scrolls up to read older messages. */
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }

  React.useEffect(() => {
    if (!stickToBottomRef.current) return;
    // Instant while streaming so tokens stay glued to the bottom; smooth after.
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming || isWaiting ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, status, isWaiting, isStreaming]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 md:px-6">
        {messages.map((message) => {
          const text = getMessageText(message).trim();
          if (!text && message.role !== "user") return null;

          const align = message.role === "user" ? "end" : "start";

          return (
            <Message key={message.id} align={align}>
              <MessageContent>
                <Bubble
                  align={align}
                  variant={message.role === "user" ? "default" : "muted"}
                >
                  <BubbleContent className="whitespace-pre-wrap">
                    {text}
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          );
        })}

        {isWaiting ? (
          <Message align="start">
            <MessageContent>
              <Bubble align="start" variant="muted">
                <BubbleContent className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  <span className="text-muted-foreground">Thinking…</span>
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        ) : null}

        <div ref={bottomRef} aria-hidden className="h-px w-full shrink-0" />
      </div>
    </div>
  );
}
