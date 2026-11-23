"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, api } from "@/lib/api/client";

interface PaginatedArray<T> {
  data: T[];
  total: number;
}

export function useResourceArray<T>(path: string | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!path) return;

    let active = true;
    const load = async () => {
      setError(null);
      try {
        const result = await api.get<PaginatedArray<T>>(path);
        if (!active) return;
        setData(result.data);
        setLoadedPath(path);
      } catch (caught) {
        if (!active) return;
        setError(
          caught instanceof ApiRequestError
            ? caught.message
            : "Não foi possível carregar os itens",
        );
        setData([]);
        setLoadedPath(path);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [path, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  return {
    data,
    error: loadedPath === path ? error : null,
    reload,
    loading: path !== null && loadedPath !== path,
  };
}
