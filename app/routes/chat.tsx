import type { Route } from "./+types/chat";
import { MessageSquareHeart, AlertTriangle } from "lucide-react";
import { requireAgeVerification } from "../lib/auth.server";

export const meta = () => {
  return [
    { title: "AI Chat 18+ | Auiso" },
    { name: "description", content: "Chat intimately with our AI companion powered by Unit Host AI." },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  // Ensure the user has verified their age before chatting
  await requireAgeVerification(request);
  return null;
}

export default function ChatPage() {
  // In a real environment, replace this URL with the actual Unit Host AI embed link or SillyTavern web interface
  const UNIT_HOST_EMBED_URL = "https://unithost.ai/embed/placeholder-character";

  return (
    <main className="flex flex-col h-[calc(100vh-4rem)] bg-night-bg">
      <div className="flex-none p-4 border-b border-night-border bg-night-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareHeart className="w-8 h-8 text-night-accent" />
          <div>
            <h1 className="text-xl font-serif font-bold text-white leading-tight">Interactive AI Companion</h1>
            <p className="text-xs text-night-muted">Powered by Unit Host AI (Future: Self After Dark)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" /> 18+ Only
        </div>
      </div>
      
      <div className="flex-grow w-full h-full relative">
        <iframe
          src={UNIT_HOST_EMBED_URL}
          className="absolute inset-0 w-full h-full border-none"
          title="Unit Host AI Chat"
          allow="microphone"
        >
          {/* Fallback content if iframe is blocked */}
          <div className="flex items-center justify-center h-full w-full bg-night-bg text-night-muted">
            <p>Your browser does not support embedded frames. Please open the chat in a new window.</p>
          </div>
        </iframe>
        
        {/* Development overlay to guide the user since it's a placeholder URL */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-center z-10 pointer-events-none">
          <div className="bg-night-card p-8 rounded-2xl border border-night-border max-w-lg pointer-events-auto shadow-2xl">
            <MessageSquareHeart className="w-16 h-16 mx-auto text-night-accent mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">Unit Host AI Embed</h2>
            <p className="text-night-muted mb-6 leading-relaxed">
              This space is reserved for the Unit Host AI chatbot iframe. To activate it, please update the <code>UNIT_HOST_EMBED_URL</code> variable in <code>app/routes/chat.tsx</code> with your actual Unit Host embed link.
            </p>
            <p className="text-sm text-night-cyan bg-night-cyan/10 p-4 rounded-lg border border-night-cyan/20">
              <strong>Future Integration:</strong> The backend proxy <code>/api/chat</code> has also been prepared for local <strong>SillyTavern (Self: After Dark)</strong> deployments.
            </p>
            <button 
              onClick={(e) => {
                const target = e.currentTarget.parentElement?.parentElement;
                if(target) target.style.display = 'none';
              }} 
              className="mt-6 w-full bg-night-accent text-white font-bold py-3 rounded-xl hover:bg-night-accent-light transition-colors"
            >
              Acknowledge & Preview UI
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
