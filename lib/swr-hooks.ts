import useSWR from 'swr';
import { getStoreBySlugAction, getOrdersByStoreAction, getProductsByStoreAction } from '@/app/actions/store';

export function useStoreData(slug: string) {
  const { data: store, error, isLoading, mutate } = useSWR(`store-${slug}`, () => getStoreBySlugAction(slug), { revalidateOnFocus: false, dedupingInterval: 60000 });
  return { store, error, isLoading, mutate };
}

export function useStoreOrders(storeId?: string) {
  const { data: orders, error, isLoading, mutate } = useSWR(storeId ? `orders-${storeId}` : null, () => getOrdersByStoreAction(storeId!), { revalidateOnFocus: false, dedupingInterval: 5000, refreshInterval: 5000 });
  return { orders, error, isLoading, mutate };
}

export function useStoreProducts(storeId?: string) {
  const { data: products, error, isLoading, mutate } = useSWR(storeId ? `products-${storeId}` : null, () => getProductsByStoreAction(storeId!), { revalidateOnFocus: false, dedupingInterval: 30000 });
  return { products, error, isLoading, mutate };
}

