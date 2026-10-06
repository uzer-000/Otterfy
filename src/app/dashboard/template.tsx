import type { ReactNode } from 'react';

/**
 * O template é remontado a cada navegação dentro do /dashboard,
 * por isso cada página entra com um fade + leve slide (ver .otter-page em globals.css).
 */
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <div className="otter-page">{children}</div>;
}
