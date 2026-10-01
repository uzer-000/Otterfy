import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-[#08070C] text-[#F8FAFC] ${inter.className}`}>
      {children}
    </div>
  );
}
