import StorefrontClient from './StorefrontClient';
import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';
import { getPublishedReviewsAction } from '@/app/actions/review';
import { getCurrentCustomerAction } from '@/app/actions/customer-auth';

export const dynamic = 'force-dynamic';

function serializeForClient<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function CustomerStorefrontPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const store = await getStoreBySlugAction(slug);

  if (!store) {
    return <StorefrontClient initialStore={null} serverFetched={true} />;
  }

  const [products, reviewsRes, rawCustomer] = await Promise.all([
    getProductsByStoreAction(store.id),
    getPublishedReviewsAction(store.id),
    getCurrentCustomerAction().catch(() => null),
  ]);

  const initialCustomer =
    rawCustomer && rawCustomer.storeId === store.id ? rawCustomer : null;

  return (
    <StorefrontClient
      initialStore={serializeForClient(store) as any}
      initialProducts={serializeForClient(products) as any}
      initialReviews={serializeForClient(
        reviewsRes?.success && Array.isArray(reviewsRes.data) ? reviewsRes.data : []
      )}
      initialCustomer={initialCustomer ? serializeForClient(initialCustomer) : null}
      serverFetched={true}
    />
  );
}
