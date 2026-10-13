import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-dvh w-full max-w-[100vw] overflow-x-hidden overscroll-x-none bg-[#F8F9FA] text-[#111827] antialiased ${inter.className}`}>
      {children}
    </div>
  );
}
