import { TaskChooseOrganization } from "@clerk/nextjs";
import { SessionTaskShell } from "@/components/auth/session-task-shell";

export default function ChooseOrganizationPage() {
  return (
    <SessionTaskShell title="Choose an organization">
      <TaskChooseOrganization redirectUrlComplete="/dashboard" />
    </SessionTaskShell>
  );
}
