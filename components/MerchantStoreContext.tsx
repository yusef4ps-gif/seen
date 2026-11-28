'use client';

import React, { createContext, useContext } from 'react';
import { Store, SubscriptionPlan } from '@/lib/types';

interface MerchantStoreContextValue {
  store: Store | null;
  setStore: React.Dispatch<React.SetStateAction<Store | null>>;
  plans: SubscriptionPlan[];
}

const MerchantStoreContext = createContext<MerchantStoreContextValue>({
  store: null,
  setStore: () => {},
  plans: [],
});

export function MerchantStoreProvider({
  value,
  children,
}: {
  value: MerchantStoreContextValue;
  children: React.ReactNode;
}) {
  return (
    <MerchantStoreContext.Provider value={value}>
      {children}
    </MerchantStoreContext.Provider>
  );
}

export function useMerchantStore() {
  return useContext(MerchantStoreContext);
}
