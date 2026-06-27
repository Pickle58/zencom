import { WidgetChat } from "@/components/widget/widget-chat";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ embedKey: string }>;
}) {
  const { embedKey } = await params;

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col">
      <WidgetChat embedKey={decodeURIComponent(embedKey)} />
    </div>
  );
}
