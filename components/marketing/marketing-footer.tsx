import Link from "next/link";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <p className="text-muted-foreground text-sm">© {year} Zencom</p>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/docs/install" className="text-muted-foreground hover:text-foreground">
            Install
          </Link>
          <Link href="/sign-up" className="text-muted-foreground hover:text-foreground">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
