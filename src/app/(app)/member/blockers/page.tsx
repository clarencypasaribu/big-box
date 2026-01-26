import { getCurrentUserProfile } from "@/utils/current-user";
import { MemberSidebar } from "@/components/member-sidebar";
import { getMemberProjects } from "@/utils/member-projects";
import { BlockersListClient } from "./blockers-list-client";

export default async function MemberBlockersPage() {
    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-3xl font-semibold text-slate-900">My Blockers</h1>
                <p className="text-slate-600">
                    Blockers assigned to you that need attention and resolution.
                </p>
            </header>

            <BlockersListClient />
        </section>
    );
}
