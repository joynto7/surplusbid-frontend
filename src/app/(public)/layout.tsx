import { AskAiProvider } from "@/components/ai/chat-widget";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <AskAiProvider>
      <PublicHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </AskAiProvider>
  );
}
