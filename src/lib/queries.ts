"use client";

import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AdminUserQuery, LotBrowseQuery } from "@/types/api";

/** Query key factory + options, shared by every component that reads the same data. */
export const qk = {
  me: ["me"] as const,
  categories: ["categories"] as const,
  lots: (q: LotBrowseQuery) => ["lots", q] as const,
  lot: (id: string) => ["lot", id] as const,
  bidHistory: (id: string, page: number, limit: number) => ["lot", id, "bids", page, limit] as const,
  myBids: ["my-bids"] as const,
  myListings: ["my-listings"] as const,
  myPayments: ["my-payments"] as const,
  payment: (id: string) => ["payment", id] as const,
  adminStats: ["admin", "stats"] as const,
  adminUsers: (q: AdminUserQuery) => ["admin", "users", q] as const,
  auditLogs: (q: { page?: number; limit?: number; entityType?: string }) => ["admin", "audit", q] as const,
};

export const categoriesQuery = () =>
  queryOptions({ queryKey: qk.categories, queryFn: api.categories, staleTime: 5 * 60_000 });

export const lotsQuery = (q: LotBrowseQuery) =>
  queryOptions({ queryKey: qk.lots(q), queryFn: () => api.browseLots(q), placeholderData: keepPreviousData });

export const lotQuery = (id: string) =>
  queryOptions({ queryKey: qk.lot(id), queryFn: () => api.lot(id), refetchInterval: 15_000 });

export const bidHistoryQuery = (id: string, page = 1, limit = 20) =>
  queryOptions({
    queryKey: qk.bidHistory(id, page, limit),
    queryFn: () => api.bidHistory(id, page, limit),
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  });

export const myBidsQuery = () => queryOptions({ queryKey: qk.myBids, queryFn: () => api.myBids(1, 50) });

export const myListingsQuery = () => queryOptions({ queryKey: qk.myListings, queryFn: api.myListings });

export const myPaymentsQuery = () => queryOptions({ queryKey: qk.myPayments, queryFn: () => api.myPayments(1, 50) });

export const paymentQuery = (id: string) => queryOptions({ queryKey: qk.payment(id), queryFn: () => api.payment(id) });

export const adminStatsQuery = () => queryOptions({ queryKey: qk.adminStats, queryFn: api.adminStats });

export const adminUsersQuery = (q: AdminUserQuery) =>
  queryOptions({ queryKey: qk.adminUsers(q), queryFn: () => api.adminUsers(q), placeholderData: keepPreviousData });

export const auditLogsQuery = (q: { page?: number; limit?: number; entityType?: string }) =>
  queryOptions({ queryKey: qk.auditLogs(q), queryFn: () => api.adminAuditLogs(q), placeholderData: keepPreviousData });
