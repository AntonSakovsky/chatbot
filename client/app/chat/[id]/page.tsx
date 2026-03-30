import { ConversationPage } from '@/components/pages/conversation-page/conversation-page';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ConversationPage id={id} />;
}
