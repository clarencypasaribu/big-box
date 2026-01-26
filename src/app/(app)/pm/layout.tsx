import { ReactNode } from "react";

import { PMSidebar } from "@/app/(app)/pm/_components/sidebar";
import { getCurrentUserProfile } from "@/utils/current-user";

export default async function PMLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentUserProfile();

  return (
    <div className="h-screen bg-[#f7f7f9] text-slate-900">
      <div className="flex h-screen w-full">
        <PMSidebar profile={profile} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
