export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full max-w-[100vw] overflow-x-hidden overscroll-x-none bg-[#F5F3FA] dark:bg-[#08070C] text-[#0F172A] dark:text-[#F8FAFC] antialiased font-sans transition-colors duration-150">
      {children}
    </div>
  );
}
