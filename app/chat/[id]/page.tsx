// // app/chat/[id]/page.tsx
// import ChatClient from "@/components/chat-client";

// type ChatPageParams = Promise<{
//   id: string;
// }>;

// type ChatPageProps = {
//   params: ChatPageParams;
// };

// export default async function ChatScreen({ params }: ChatPageProps) {
//   // این‌جا Promise رو باز می‌کنیم
//   const { id } = await params;

//   console.log("ChatScreen id:", id);

//   return (
//     <div style={{ minHeight: "100vh", background: "#111", color: "white" }}>
//       <div style={{ padding: 16, borderBottom: "1px solid #444" }}>
//         <h1>DEBUG /chat/[id]</h1>
//         <pre>{JSON.stringify({ id }, null, 2)}</pre>
//       </div>
//       <ChatClient companionId={id} />
//     </div>
//   );
// }

import ChatClient from "@/components/chat-client"

type ChatPageProps = {
  params: {
    id: string
  }
}

export default async function ChatScreen({ params }: ChatPageProps) {
  const { id } = params

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-2 md:px-6">
      <div className="w-full max-w-5xl h-screen md:h-[800px] bg-[#020617] border border-white/5 rounded-none md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden">
        {/* این همون UI فعلیت برای چته */}
        <ChatClient companionId={id} />
      </div>
    </div>
  )
}