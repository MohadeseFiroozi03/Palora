// // app/chat/[id]/page.tsx
// import ChatClient from "@/components/chat-client";

// type ChatPageProps = {
//   params: {
//     id: string;
//   };
// };

// export default function ChatScreen({ params }: ChatPageProps) {
//   const companionId = params.id;
//   return <ChatClient companionId={companionId} />;
// }


// app/chat/[id]/page.tsx
import ChatClient from "@/components/chat-client";

type ChatPageParams = Promise<{
  id: string;
}>;

type ChatPageProps = {
  params: ChatPageParams;
};

export default async function ChatScreen({ params }: ChatPageProps) {
  // این‌جا Promise رو باز می‌کنیم
  const { id } = await params;

  console.log("ChatScreen id:", id);

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "white" }}>
      <div style={{ padding: 16, borderBottom: "1px solid #444" }}>
        <h1>DEBUG /chat/[id]</h1>
        <pre>{JSON.stringify({ id }, null, 2)}</pre>
      </div>
      <ChatClient companionId={id} />
    </div>
  );
}