"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/queries";
import type { AdminUser, Category, ContactMessage, MessageStatus, Paginated } from "@/types/api";

/**
 * Approve/reject a business. Optimistically updates every cached users page
 * (and drops the user from the PENDING queue) so the row changes instantly.
 */
export function useVerifyUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "VERIFIED" | "REJECTED" }) => api.adminVerifyUser(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      const snapshots = qc.getQueriesData<Paginated<AdminUser>>({ queryKey: ["admin", "users"] });
      for (const [key, page] of snapshots) {
        if (!page) continue;
        const onlyPending = (key[2] as { verificationStatus?: string } | undefined)?.verificationStatus === "PENDING";
        qc.setQueryData<Paginated<AdminUser>>(key, {
          ...page,
          items: onlyPending
            ? page.items.filter((u) => u.id !== id)
            : page.items.map((u) => (u.id === id ? { ...u, verificationStatus: status } : u)),
        });
      }
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      for (const [key, data] of ctx?.snapshots ?? []) qc.setQueryData(key, data);
    },
    onSuccess: (user, { status }) =>
      toast.success(status === "VERIFIED" ? "Business verified" : "Verification rejected", {
        description: user.companyName,
      }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    meta: { errorToast: "Couldn't update verification" },
  });
}

/** Adds a category and shows it in the list before the server confirms. */
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; imageUrl?: string }) => api.createCategory(input),
    onMutate: async ({ name }) => {
      await qc.cancelQueries({ queryKey: qk.categories });
      const prev = qc.getQueryData<Category[]>(qk.categories);
      const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
      qc.setQueryData<Category[]>(qk.categories, (list) =>
        [...(list ?? []), { id: `optimistic-${slug}`, name, slug }].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.categories, ctx.prev),
    onSuccess: (c) => toast.success("Category created", { description: c.name }),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.categories }),
    meta: { errorToast: "Couldn't create the category" },
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: "RESOLVED" | "REJECTED"; resolutionNote: string }) =>
      api.resolveDispute(v.id, { status: v.status, resolutionNote: v.resolutionNote }),
    onSuccess: (d) => {
      toast.success(d.status === "RESOLVED" ? "Dispute resolved" : "Claim rejected", {
        description: "Both parties can now see the decision.",
      });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    meta: { errorToast: "Couldn't update the dispute" },
  });
}

/** Marks a contact message read, unread or archived; every cached inbox page updates at once. */
export function useUpdateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MessageStatus }) => api.adminUpdateMessage(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin", "messages"] });
      const snapshots = qc.getQueriesData<Paginated<ContactMessage>>({ queryKey: ["admin", "messages"] });
      for (const [key, page] of snapshots) {
        if (page) qc.setQueryData(key, { ...page, items: page.items.map((m) => (m.id === id ? { ...m, status } : m)) });
      }
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      for (const [key, data] of ctx?.snapshots ?? []) qc.setQueryData(key, data);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      qc.invalidateQueries({ queryKey: qk.adminStats });
    },
    meta: { errorToast: "Couldn't update the message" },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.adminDeleteReview(id),
    onSuccess: () => {
      toast.success("Review removed", { description: "The seller's rating has been recalculated." });
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    meta: { errorToast: "Couldn't remove the review" },
  });
}
