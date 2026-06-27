import { WidgetChat } from "@/components/widget/widget-chat";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ embedKey: string }>;
}) {
  const { embedKey } = await params;

  return (
    <div className="h-dvh w-full">
      <WidgetChat embedKey={decodeURIComponent(embedKey)} />
    </div>
  );
}
