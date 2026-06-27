import Link from "next/link";

export const metadata = {
  title: "Install widget — Zencom",
  description:
    "Add the Zencom chat widget to your site with a single script tag. Get your embed key from the dashboard after signing up.",
};

const EMBED_SNIPPET = `<script
  src="/embed.js"
  data-key="YOUR_EMBED_KEY"
  data-title="Chat with us"
  data-color="#2563eb"
  data-position="bottom-right"
  data-border-radius="12"
  async
></script>`;

const EMBED_SNIPPET_PROACTIVE = `<!-- Optional: proactive chat bubble + auto-open -->
  data-proactive-enabled="true"
  data-proactive-delay="5000"
  data-proactive-message="Hi! How can we help?"`;

export default function InstallDocsPage() {
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
            {EMBED_SNIPPET}
          </pre>
          <p className="text-muted-foreground mt-3">
            Replace <code>YOUR_EMBED_KEY</code> with your key. Optional attributes:{" "}
            <code>data-title</code> (widget header), <code>data-color</code> (accent hex),{" "}
            <code>data-position</code> (<code>bottom-right</code> or <code>bottom-left</code>), and{" "}
            <code>data-border-radius</code> (panel corners in px). For proactive chat:
            <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/60 p-3 text-xs">
              {EMBED_SNIPPET_PROACTIVE}
            </pre>
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
