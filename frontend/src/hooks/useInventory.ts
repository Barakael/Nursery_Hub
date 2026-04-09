import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: number;
  school_id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  created_at: string;
}

export interface InventorySale {
  id: number;
  item?: { id: number; name: string; price: number };
  quantity: number;
  unit_price: number;
  total_price: number;
  recipient_type: "student" | "other";
  student?: { id: number; name: string } | null;
  recipient_name?: string | null;
  recorder?: { id: number; name: string };
  payment_method: "cash" | "account";
  notes?: string | null;
  created_at: string;
}

export interface InventorySummary {
  today_revenue: number;
  month_revenue: number;
  low_stock_count: number;
  total_items_sold: number;
}

// ── Items ─────────────────────────────────────────────────────────────────────

export const useInventoryItems = (params?: { page?: number; per_page?: number; low_stock?: boolean }) =>
  useQuery({
    queryKey: ["inventory", "items", params],
    queryFn: () => api.get("/v1/inventory/items", { params }).then((r) => r.data),
  });

export const useCreateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      price: number;
      stock_quantity: number;
      low_stock_threshold?: number;
    }) => api.post("/v1/inventory/items", data).then((r) => r.data.data as InventoryItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "items"] }),
  });
};

export const useUpdateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryItem> & { id: number }) =>
      api.put(`/v1/inventory/items/${id}`, data).then((r) => r.data.data as InventoryItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "items"] }),
  });
};

export const useDeleteInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/inventory/items/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "items"] }),
  });
};

// ── Sales ─────────────────────────────────────────────────────────────────────

export const useInventorySales = (params?: { page?: number; per_page?: number; item_id?: number }) =>
  useQuery({
    queryKey: ["inventory", "sales", params],
    queryFn: () => api.get("/v1/inventory/sales", { params }).then((r) => r.data),
  });

export const useCreateInventorySale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      item_id: number;
      quantity: number;
      recipient_type: "student" | "other";
      student_id?: number | null;
      recipient_name?: string;
      payment_method?: "cash" | "account";
      notes?: string;
    }) => api.post("/v1/inventory/sales", data).then((r) => r.data.data as InventorySale),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales"] });
      qc.invalidateQueries({ queryKey: ["inventory", "items"] });
      qc.invalidateQueries({ queryKey: ["inventory", "summary"] });
    },
  });
};

// ── Summary & Export ─────────────────────────────────────────────────────────

export const useInventorySummary = () =>
  useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => api.get("/v1/inventory/summary").then((r) => r.data as InventorySummary),
  });

export const exportInventoryCSV = async () => {
  const response = await api.get("/v1/inventory/export", { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "inventory_sales.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
