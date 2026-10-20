"use client";

import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import type { AdminUserQuery, LotBrowseQuery, MessageStatus, ReviewQuery } from "@/types/api";

export { qk };

export const categoriesQuery = () =>
  queryOptions({ queryKey: qk.categories, queryFn: api.categories, staleTime: 5 * 60_000 });

export const lotsQuery = (q: LotBrowseQuery) =>
  queryOptions({ queryKey: qk.lots(q), queryFn: () => api.browseLots(q), placeholderData: keepPreviousData });

export const lotQuery = (id: string) =>
  queryOptions({ queryKey: qk.lot(id), queryFn: () => api.lot(id), refetchInterval: 15_000 });

export const relatedLotsQuery = (id: string) =>
  queryOptions({ queryKey: qk.related(id), queryFn: () => api.relatedLots(id, 4), staleTime: 60_000 });

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

export const myReviewsQuery = (q: ReviewQuery) =>
  queryOptions({ queryKey: qk.myReviews(q), queryFn: () => api.myReviews(q), placeholderData: keepPreviousData });

export const reviewableLotsQuery = () => queryOptions({ queryKey: qk.reviewable, queryFn: api.reviewableLots });

export const receivedReviewsQuery = (q: ReviewQuery) =>
  queryOptions({
    queryKey: qk.receivedReviews(q),
    queryFn: () => api.receivedReviews(q),
    placeholderData: keepPreviousData,
  });

export const sellerReviewsQuery = (sellerId: string, q: ReviewQuery) =>
  queryOptions({
    queryKey: qk.sellerReviews(sellerId, q),
    queryFn: () => api.sellerReviews(sellerId, q),
    placeholderData: keepPreviousData,
  });

export const myDisputesQuery = (page: number) =>
  queryOptions({
    queryKey: qk.myDisputes(page),
    queryFn: () => api.myDisputes(page, 10),
    placeholderData: keepPreviousData,
  });

export const recommendationsQuery = (seed: string[]) =>
  queryOptions({
    queryKey: qk.recommendations(seed),
    queryFn: () => api.aiRecommendations(seed, 8),
    staleTime: 2 * 60_000,
    meta: { errorToast: false },
  });

export const trendingQuery = () =>
  queryOptions({
    queryKey: qk.trending,
    queryFn: () => api.aiTrending(8),
    staleTime: 60_000,
    meta: { errorToast: false },
  });

export const adminStatsQuery = () => queryOptions({ queryKey: qk.adminStats, queryFn: api.adminStats });

export const adminAnalyticsQuery = () =>
  queryOptions({ queryKey: qk.adminAnalytics, queryFn: api.adminAnalytics, staleTime: 60_000 });

export const adminInsightsQuery = () =>
  queryOptions({ queryKey: qk.adminInsights, queryFn: api.adminInsights, staleTime: 60_000 });

export const adminUsersQuery = (q: AdminUserQuery) =>
  queryOptions({ queryKey: qk.adminUsers(q), queryFn: () => api.adminUsers(q), placeholderData: keepPreviousData });

export const adminMessagesQuery = (q: { page: number; limit: number; status?: MessageStatus; q?: string }) =>
  queryOptions({
    queryKey: qk.adminMessages(q),
    queryFn: () => api.adminMessages(q),
    placeholderData: keepPreviousData,
  });

export const adminReviewsQuery = (q: ReviewQuery) =>
  queryOptions({ queryKey: qk.adminReviews(q), queryFn: () => api.adminReviews(q), placeholderData: keepPreviousData });

export const adminDisputesQuery = (q: { page: number; limit: number; status?: string; q?: string }) =>
  queryOptions({
    queryKey: qk.adminDisputes(q),
    queryFn: () => api.adminDisputes(q),
    placeholderData: keepPreviousData,
  });

export const auditLogsQuery = (q: { page?: number; limit?: number; entityType?: string }) =>
  queryOptions({ queryKey: qk.auditLogs(q), queryFn: () => api.adminAuditLogs(q), placeholderData: keepPreviousData });
