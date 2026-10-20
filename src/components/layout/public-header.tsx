import { SearchDialog } from "@/components/ai/search-dialog";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { DesktopNav, HeaderAuth, MobileNav } from "./public-nav";

/** Full-width sticky header. Server-rendered shell; nav state and auth are client islands. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <DesktopNav />
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchDialog />
          <ThemeToggle />
          <HeaderAuth />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
