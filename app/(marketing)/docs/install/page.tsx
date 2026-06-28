import Link from "next/link";
import { headers } from "next/headers";
import { BRAND_WIDGET_COLOR } from "@/lib/brand";

export const metadata = {
  title: "Install widget — Zencom",
  description:
    "Add the Zencom chat widget to your site with a single script tag. Get your embed key from the dashboard after signing up.",
};

function buildEmbedSnippet(origin: string) {
  return `<script
  src="${origin}/embed.js"
  data-key="YOUR_EMBED_KEY"
  data-title="Chat with us"
  data-color="${BRAND_WIDGET_COLOR}"
  data-position="bottom-right"
  data-border-radius="12"
  async
></script>`;
}

const EMBED_SNIPPET_PROACTIVE = `<!-- Optional: proactive chat bubble + auto-open -->
  data-proactive-enabled="true"
  data-proactive-delay="5000"
  data-proactive-message="Hi! How can we help?"`;

async function getRequestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "";
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function InstallDocsPage() {
  const origin = await getRequestOrigin();
  const embedSnippet = buildEmbedSnippet(origin);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Install the widget</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Add live chat to your site in a few minutes. Customize colors and placement from the{" "}
        <Link href="/dashboard/customize" className="text-foreground underline underline-offset-4">
          Customize
        </Link>{" "}
        page after signing up.
      </p>
      <ol className="mt-8 list-decimal space-y-6 pl-5 text-sm">
        <li>
          <Link href="/sign-up" className="text-foreground underline underline-offset-4">
            Sign up
          </Link>{" "}
          and create a Clerk organization — your workspace is provisioned automatically.
        </li>
        <li>
          Open <strong>Dashboard → Settings</strong> and copy your embed key (shown once on first
          visit to the dashboard overview).
        </li>
        <li>
          Add this script before <code>&lt;/body&gt;</code> on your site:
          <pre className="mt-3 overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
            {embedSnippet}
          </pre>
          <p className="text-muted-foreground mt-3">
            Replace <code>YOUR_EMBED_KEY</code> with your key. Optional attributes:{" "}
            <code>data-title</code> (widget header), <code>data-color</code> (accent hex),{" "}
            <code>data-position</code> (<code>bottom-right</code> or <code>bottom-left</code>), and{" "}
            <code>data-border-radius</code> (panel corners in px). For proactive chat:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/60 p-3 text-xs">
            {EMBED_SNIPPET_PROACTIVE}
          </pre>
          <p className="text-muted-foreground mt-2">
            You can also set these from{" "}
            <Link href="/dashboard/customize" className="text-foreground underline underline-offset-4">
              Dashboard → Customize
            </Link>
            .
          </p>
        </li>
        <li>Visitors can chat from the widget; your team replies from the inbox.</li>
      </ol>
    </div>
  );
}
