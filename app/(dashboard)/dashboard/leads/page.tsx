"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LeadStatus = "new" | "contacted" | "closed";

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>();
  const [search, setSearch] = useState("");
  const leads = useQuery(api.leads.list, { status: statusFilter, search: search || undefined });
  const updateStatus = useMutation(api.leads.updateStatus);
  const csv = useQuery(api.leads.exportCsv, {});

  function downloadCsv() {
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-muted-foreground text-sm">Pipeline from widget capture.</p>
        </div>
        <Button variant="outline" onClick={downloadCsv} disabled={!csv}>
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["new", "contacted", "closed"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(statusFilter === status ? undefined : status)}
          >
            {status}
          </Button>
        ))}
        <input
          className="border-input h-8 rounded-md border px-2 text-sm"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(leads ?? []).map((lead: Doc<"leads">) => (
              <TableRow key={lead._id}>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{lead.status}</Badge>
                </TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell className="space-x-2">
                  {lead.status !== "contacted" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void updateStatus({ leadId: lead._id, status: "contacted" })
                      }
                    >
                      Contacted
                    </Button>
                  ) : null}
                  {lead.status !== "closed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void updateStatus({ leadId: lead._id, status: "closed" })
                      }
                    >
                      Close
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
