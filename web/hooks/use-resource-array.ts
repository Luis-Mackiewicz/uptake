"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";

export function useResourceArray<T>(path: string | null) {
  const { notify } = useToast();
  const [data, setData] = useState<T[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!path) return;

    let active = true;
    const load = async () => {
      try {
        const result = await api.get<T[]>(path);
        if (active) setData(result);
      } catch {
        if (active) {
          notify("Não foi possível carregar os itens", "error");
          setData([]);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [path, reloadKey, notify]);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  return { data, reload, loading: data === null };
}
