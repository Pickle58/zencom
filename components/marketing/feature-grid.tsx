const FEATURES = [
  { title: "Live inbox", body: "Real-time conversations with filters and assignment." },
  { title: "Embeddable widget", body: "One-line install with secure embed keys." },
  { title: "KB + AI", body: "Upload docs, publish help articles, and assist visitors." },
] as const;

export function FeatureGrid() {
  return (
    <section className="mx-auto grid w-full max-w-4xl gap-4 px-4 pb-24 sm:grid-cols-3">
      {FEATURES.map((item) => (
        <div key={item.title} className="rounded-xl border border-t-2 border-t-accent bg-card p-5 text-left">
          <h2 className="font-medium">{item.title}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{item.body}</p>
        </div>
      ))}
    </section>
  );
}
