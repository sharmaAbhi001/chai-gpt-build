import { loadChatMessages } from '@/features/ai/action/chat-store';
import { getConversation } from '@/features/conversation/action/conversation-action';
import { ConversationView } from '@/features/conversation/component/conversation-view';
import { notFound } from 'next/navigation';

type ConversationPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Conversation page — loads messages and renders the chat UI for a given ID.
 */
const page = async ({ params }: ConversationPageProps) => {
  const { id } = await params;

  try {
    await getConversation(id);
  } catch {
    notFound();
  }

  const initialMessages = await loadChatMessages(id);

  return (
    <ConversationView
      key={id}
      conversationId={id}
      initialMessages={initialMessages}
    />
  );
};

export default page;
