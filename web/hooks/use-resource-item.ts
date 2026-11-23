"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";

export function useResourceItem<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!path) return;

    let active = true;

    const load = async () => {
      setError(null);
      try {
        const result = await api.get<T>(path);
        if (!active) return;
        setData(result);
        setLoadedPath(path);
      } catch (caught) {
        if (!active) return;
        setData(null);
        setError(friendlyApiMessage(caught, "Não foi possível carregar os dados"));
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
    loading: path !== null && loadedPath !== path,
    reload,
  };
}
