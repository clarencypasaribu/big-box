import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function MemberProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  redirect(`/member/project/${projectId}`);
}
