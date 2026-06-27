import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InstallPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Install widget</h1>
        <p className="text-muted-foreground text-sm">
          Add Zencom to your site and start receiving conversations.
        </p>
      </div>
      <ol className="list-decimal space-y-4 pl-5 text-sm">
        <li>
          Copy your embed key from{" "}
          <Link href="/dashboard/settings" className="underline">
            Settings
          </Link>
          .
        </li>
        <li>Paste the embed snippet on your website.</li>
        <li>Open the inbox to reply to visitors in real time.</li>
      </ol>
      <Link href="/docs/install" className={cn(buttonVariants({ variant: "outline" }))}>
        View public install guide
      </Link>
    </div>
  );
}
