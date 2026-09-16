import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function CreateStoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = cookies().get('seen_session_user_id')?.value;
  
  if (!userId) {
    redirect('/seenlogin5xa');
  }
  
  return <>{children}</>;
}
