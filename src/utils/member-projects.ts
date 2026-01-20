import type { MemberProjectItem } from "@/components/member-sidebar";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

const projectColors: MemberProjectItem["color"][] = ["green", "blue", "purple", "amber"];

export async function getMemberProjects(userId: string | null): Promise<MemberProjectItem[]> {
  if (!userId) return [];

  try {
    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("project_members")
      .select("project_id, projects ( id, name )")
      .eq("member_id", userId);

    if (error) {
      return [];
    }

    const seen = new Set<string>();
    const projects: MemberProjectItem[] =
      data
        ?.map((row: any, index: number) => {
          const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
          const id = project?.id ?? row.project_id ?? null;
          const name = project?.name ?? "Untitled Project";
          if (!id || seen.has(id)) return null;
          seen.add(id);
          return {
            id,
            name,
            color: projectColors[index % projectColors.length],
          };
        })
        .filter(Boolean) ?? [];

    return projects;
  } catch {
    return [];
  }
}
