"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuArchive, LuArchiveRestore, LuInbox, LuMail, LuMailOpen, LuReply } from "react-icons/lu";
import { type Column, DataTable } from "@/components/shared/data-table";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateMessage } from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, formatRelative } from "@/lib/format";
import { adminMessagesQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { ContactMessage, MessageStatus } from "@/types/api";

const DEFAULTS = { status: "all", q: "" };
const PER_PAGE = 10;

const TOPICS: Record<string, string> = {
  buying: "Buying & bidding",
  selling: "Selling a lot",
  verification: "Verification",
  payments: "Deposits & payments",
  other: "Something else",
};
const topicLabel = (t: string) => TOPICS[t] ?? t;

/** Support inbox for messages sent from the public contact form. Status, search and page live in the URL. */
export function MessagesInbox() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const query = {
    page,
    limit: PER_PAGE,
    status: values.status === "all" ? undefined : (values.status as MessageStatus),
    q: values.q || undefined,
  };
  const messages = useQuery(adminMessagesQuery(query));
  const update = useUpdateMessage();
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const setStatus = (m: ContactMessage, status: MessageStatus) => {
    update.mutate({ id: m.id, status });
    setSelected((cur) => (cur?.id === m.id ? { ...cur, status } : cur));
  };

  const openMessage = (m: ContactMessage) => {
    setSelected(m);
    if (m.status === "NEW") setStatus(m, "READ");
  };

  const counts = messages.data?.counts ?? {};
  const total = (counts.NEW ?? 0) + (counts.READ ?? 0) + (counts.ARCHIVED ?? 0);

  const columns: Column<ContactMessage>[] = [
    {
      key: "from",
      header: "From",
      cell: (m) => (
        <div className="min-w-0 max-w-40 sm:max-w-64">
          <p className={cn("truncate", m.status === "NEW" ? "font-semibold" : "font-medium")}>{m.name}</p>
          <p className="truncate text-muted-foreground text-xs">{m.email}</p>
        </div>
      ),
    },
    { key: "topic", header: "Topic", hideBelow: "sm", cell: (m) => topicLabel(m.topic) },
    {
      key: "message",
      header: "Message",
      hideBelow: "lg",
      cell: (m) => <p className="line-clamp-1 max-w-md text-muted-foreground">{m.message}</p>,
    },
    {
      key: "received",
      header: "Received",
      hideBelow: "md",
      cell: (m) => <span title={formatDateTime(m.createdAt)}>{formatRelative(m.createdAt)}</span>,
    },
    { key: "status", header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
    {
      key: "open",
      header: <span className="sr-only">Open</span>,
      className: "text-right",
      cell: (m) => (
        <Button size="sm" variant={m.status === "NEW" ? "default" : "outline"} onClick={() => openMessage(m)}>
          {m.status === "NEW" ? <LuMail /> : <LuMailOpen />} Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterTabs
          label="Filter messages by status"
          value={values.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "all", label: "All", count: total },
            { value: "NEW", label: "New", count: counts.NEW ?? 0 },
            { value: "READ", label: "Read", count: counts.READ ?? 0 },
            { value: "ARCHIVED", label: "Archived", count: counts.ARCHIVED ?? 0 },
          ]}
        />
        <SearchInput
          value={values.q}
          onChange={(q) => set({ q })}
          placeholder="Search name, email or message"
          label="Search messages"
        />
      </div>
      <DataTable
        columns={columns}
        rows={messages.data?.items}
        loading={messages.isPending}
        dimmed={messages.isPlaceholderData}
        getRowId={(m) => m.id}
        caption="Contact messages"
        empty={{
          icon: LuInbox,
          title: values.q || values.status !== "all" ? "No messages match" : "The inbox is empty",
          description:
            values.q || values.status !== "all"
              ? "Try another status or search term."
              : "Messages sent from the contact page appear here.",
        }}
      />
      {messages.data && (
        <PaginationBar
          page={page}
          totalPages={messages.data.meta.totalPages}
          total={messages.data.meta.total}
          onPage={setPage}
          label="messages"
        />
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-muted-foreground text-xs">{topicLabel(selected.topic)}</span>
                </div>
                <DialogTitle>Message from {selected.name}</DialogTitle>
                <DialogDescription>
                  <a href={`mailto:${selected.email}`} className="hover:underline">
                    {selected.email}
                  </a>{" "}
                  · {formatDateTime(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[50vh] overflow-y-auto whitespace-pre-line rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                {selected.message}
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex gap-2">
                  {selected.status === "ARCHIVED" ? (
                    <Button variant="outline" onClick={() => setStatus(selected, "READ")}>
                      <LuArchiveRestore /> Restore
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setStatus(selected, "ARCHIVED")}>
                        <LuArchive /> Archive
                      </Button>
                      {selected.status === "READ" && (
                        <Button variant="ghost" onClick={() => setStatus(selected, "NEW")}>
                          <LuMail /> Mark unread
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Button asChild>
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${topicLabel(selected.topic)} (SurplusBid support)`)}`}
                  >
                    <LuReply /> Reply by email
                  </a>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
