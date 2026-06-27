import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const qkAssets = () => ["assets"] as const;
export const qkAsset = (id: string) => ["assets", id] as const;
export const qkVaults = () => ["vaults"] as const;
export const qkTransactions = (limit = 50) => ["transactions", limit] as const;
export const qkAlerts = () => ["alerts"] as const;
export const qkPrices = () => ["prices"] as const;
export const qkProfile = () => ["profile"] as const;
export const qkRoles = () => ["roles"] as const;

export const assetsQuery = () =>
  queryOptions({
    queryKey: qkAssets(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, vault:vaults(id,name,code,location)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const assetQuery = (id: string) =>
  queryOptions({
    queryKey: qkAsset(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, vault:vaults(id,name,code,location,latitude,longitude)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const vaultsQuery = () =>
  queryOptions({
    queryKey: qkVaults(),
    queryFn: async () => {
      const { data, error } = await supabase.from("vaults").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const transactionsQuery = (limit = 50) =>
  queryOptions({
    queryKey: qkTransactions(limit),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, asset:assets(id,name,asset_type), from_vault:vaults!from_vault_id(name,code), to_vault:vaults!to_vault_id(name,code)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

export const alertsQuery = () =>
  queryOptions({
    queryKey: qkAlerts(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

export const pricesQuery = () =>
  queryOptions({
    queryKey: qkPrices(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_snapshots")
        .select("*")
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      // Latest snapshot per metal
      const seen = new Set<string>();
      const latest: typeof data = [];
      for (const row of data ?? []) {
        if (!seen.has(row.metal)) { seen.add(row.metal); latest.push(row); }
      }
      return latest;
    },
  });

export const profileQuery = () =>
  queryOptions({
    queryKey: qkProfile(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return { ...data, email: user.email, id: user.id };
    },
  });

export const rolesQuery = () =>
  queryOptions({
    queryKey: qkRoles(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });
