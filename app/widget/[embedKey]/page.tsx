import { WidgetChat } from "@/components/widget/widget-chat";
import { WidgetErrorBoundary } from "@/components/widget/widget-error-boundary";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ embedKey: string }>;
}) {
  const { embedKey } = await params;

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col">
      <WidgetErrorBoundary>
        <WidgetChat embedKey={decodeURIComponent(embedKey)} />
      </WidgetErrorBoundary>
    </div>
  );
}
