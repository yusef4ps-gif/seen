import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function CreateStoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Remove auth check to allow new merchants to register
  
  return <>{children}</>;
}
