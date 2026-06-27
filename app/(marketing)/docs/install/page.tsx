import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function InstallDocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold">Install the widget</h1>
        <ol className="mt-8 list-decimal space-y-6 pl-5 text-sm">
          <li>
            Sign up and create a Clerk organization — your workspace is provisioned automatically.
          </li>
          <li>
            Open <strong>Dashboard → Settings</strong> and copy your embed key (shown once on first
            visit to the dashboard overview).
          </li>
          <li>
            Add this script before <code>&lt;/body&gt;</code> on your site:
            <pre className="mt-3 overflow-x-auto rounded-lg border bg-muted p-4 text-xs">{`<script
  src="https://YOUR_APP_DOMAIN/embed.js"
  data-key="wk_YOUR_EMBED_KEY"
  async
></script>`}</pre>
          </li>
          <li>Visitors can chat from the widget; your team replies from the inbox.</li>
        </ol>
      </main>
    </div>
  );
}
