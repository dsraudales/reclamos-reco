import { z } from "zod";

import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/constants";

type SearchParamValue = string | string[] | undefined;

export type SubmissionFilterState = {
  search: string;
  status: "all" | SubmissionStatus;
  dateFrom: string;
  dateTo: string;
};

export type SubmissionQueryFilters = {
  search?: string;
  status?: SubmissionStatus;
  dateFrom?: string;
  dateTo?: string;
};

const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

const submissionFiltersSchema = z.object({
  search: z.string().trim().max(80).optional(),
  status: z.union([z.enum(SUBMISSION_STATUSES), z.literal("all")]).default("all"),
  dateFrom: dateParamSchema,
  dateTo: dateParamSchema,
});

function getFirstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeOptionalString(value: SearchParamValue) {
  const normalized = getFirstValue(value)?.trim();
  return normalized ? normalized : undefined;
}

export function parseSubmissionFilters(
  searchParams: Record<string, SearchParamValue>,
): SubmissionFilterState {
  const parsed = submissionFiltersSchema.safeParse({
    search: normalizeOptionalString(searchParams.search),
    status: normalizeOptionalString(searchParams.status) ?? "all",
    dateFrom: normalizeOptionalString(searchParams.dateFrom),
    dateTo: normalizeOptionalString(searchParams.dateTo),
  });

  if (!parsed.success) {
    return {
      search: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
    };
  }

  const { search, status } = parsed.data;
  let { dateFrom, dateTo } = parsed.data;

  if (dateFrom && dateTo && dateFrom > dateTo) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }

  return {
    search: search ?? "",
    status,
    dateFrom: dateFrom ?? "",
    dateTo: dateTo ?? "",
  };
}

export function toSubmissionQueryFilters(
  filters: SubmissionFilterState,
): SubmissionQueryFilters {
  return {
    search: filters.search || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}

export function buildSubmissionFilterQueryString(
  filters: SubmissionFilterState,
) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  return params.toString();
}

export function countActiveSubmissionFilters(filters: SubmissionFilterState) {
  return [filters.search, filters.dateFrom, filters.dateTo].filter(Boolean)
    .length + Number(filters.status !== "all");
}
