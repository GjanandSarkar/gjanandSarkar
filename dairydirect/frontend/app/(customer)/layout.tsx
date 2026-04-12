import { AppProvider } from '@/lib/context';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProvider>{children}</AppProvider>;
}
