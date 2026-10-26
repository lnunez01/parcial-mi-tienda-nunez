import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { describeSync, syncProducts } from '@/services/sync';

interface SyncState {
  isSyncing: boolean;
  message: string | null;
  isError: boolean;
}

/**
 * Expone sync() para el botón Sincronizar y, como extra, sincroniza solo
 * cuando el teléfono recupera la conexión.
 */
export function useSync(userId: string | undefined) {
  const [state, setState] = useState<SyncState>({ isSyncing: false, message: null, isError: false });
  const runningRef = useRef(false); // evita dos sincronizaciones a la vez

  const sync = useCallback(
    async (auto = false) => {
      if (!userId || runningRef.current) return;
      runningRef.current = true;
      setState((s) => ({ ...s, isSyncing: true }));
      try {
        const result = await syncProducts(userId);
        const text = describeSync(result);
        setState({ isSyncing: false, message: auto ? `Conexión recuperada: ${text}` : text, isError: false });
      } catch (e) {
        setState({
          isSyncing: false,
          message: e instanceof Error ? e.message : 'No se pudo sincronizar',
          isError: true,
        });
      } finally {
        runningRef.current = false;
      }
    },
    [userId]
  );

  // Sincronización automática al pasar de sin conexión a con conexión
  useEffect(() => {
    let wasConnected: boolean | null = null;
    const unsubscribe = NetInfo.addEventListener((net) => {
      const connected = net.isConnected === true && net.isInternetReachable !== false;
      if (wasConnected === false && connected) sync(true);
      wasConnected = connected;
    });
    return unsubscribe;
  }, [sync]);

  return { ...state, sync: () => sync(false) };
}
