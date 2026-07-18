import { loadChatMessages, saveChatMessages } from "@/features/ai/action/chat-store";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import simpleRateLimiter from "@/lib/rateLimiter/simplerate-limite";
import { auth } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  gateway,
  streamText,
  toUIMessageStream,
  type UIMessage,
  isStepCount
} from "ai";

import exaWebTool from "@/features/ai/utils/tools";

export async function POST(req: Request) {
  await auth.protect();

  const { message, id }: { message: UIMessage; id: string } = await req.json();

  if (!message || !id) {
    return new Response("Missing message or conversation id", { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      "OpenAI API key is missing. Set OPENAI_API_KEY in your .env file.",
      { status: 500 }
    );
  }

  const user = await requireUser();


  const limited = await simpleRateLimiter(user.id);

  if(limited) return limited;


  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const previousMessages = await loadChatMessages(id);

  const alreadySaved = previousMessages.some(
    (storedMessage) => storedMessage.id === message.id
  );

  const messages = alreadySaved
    ? previousMessages
    : [...previousMessages, message];

  if (!alreadySaved) {
    await saveChatMessages(id, [message]);
  }

  try {
    const result = streamText({
      model: gateway("openai/gpt-4o-mini"),
      system: conversation.systemPrompt ?? `
      You are ChaiGpt, a helpful assistant.

Use the exa_search tool whenever the user asks about:
- current events, news, or recent developments
- anything that may have changed after your training data
- real-time facts (prices, scores, weather, "today"/"latest")

After the tool returns results, summarize them clearly and cite sources.
Do NOT call the tool for general knowledge you already know.

       `,
      tools:{
        exa_search: gateway.tools.exaSearch(exaWebTool)
    },
    stopWhen:isStepCount(3),
      messages: await convertToModelMessages(messages),
    });

    // Keep the stream alive even if the client disconnects, so onEnd can persist.
    result.consumeStream();

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
        onError: (error) => {
          console.error("Chat stream error:", error);
          return error instanceof Error
            ? error.message
            : "Failed to generate response";
        },
        onEnd: async ({ messages: finalMessages, isAborted }) => {
          if (isAborted) return;
          try {
            await saveChatMessages(id, finalMessages, { updateTitle: false });
          } catch (error) {
            console.error("Failed to save chat messages:", error);
          }
        },
      }),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const messageText =
      error instanceof Error ? error.message : "Failed to generate response";
    return new Response(messageText, { status: 500 });
  }
}
