"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Page } from "@/lib/api/types";
import { useToast } from "@/components/ui/toast";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function useResourceList<T>(path: string, params: QueryParams = {}) {
  const { notify } = useToast();
  const paramsKey = JSON.stringify(params);
  const [data, setData] = useState<Page<T> | null>(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const queryParams = JSON.parse(paramsKey) as QueryParams;
        const result = await api.get<Page<T>>(path, { ...queryParams, page });
        if (active) setData(result);
      } catch {
        if (active) {
          notify("Não foi possível carregar os dados", "error");
          setData({ data: [], page, limit: 20, total: 0, totalPages: 0 });
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [path, paramsKey, page, reloadKey, notify]);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  return { data, page, setPage, reload, loading: data === null };
}
