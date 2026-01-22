import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/utils/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        const comments = await prisma.task_comments.findMany({
            where: { task_id: taskId },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({ data: comments });
    } catch (e: any) {
        console.error("Unexpected error in GET comments:", e);
        return NextResponse.json({ message: e.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ message: "Text required" }, { status: 400 });
        }

        let authorName = "Unknown";
        try {
            const profile = await getCurrentUserProfile();
            authorName = profile.name || profile.email || "Unknown";
        } catch (err) {
            console.warn("Failed to get user profile for comment:", err);
        }

        const comment = await prisma.task_comments.create({
            data: {
                task_id: taskId,
                author: authorName,
                text,
            }
        });

        return NextResponse.json({ data: comment });
    } catch (e: any) {
        console.error("Unexpected error in POST comment:", e);
        return NextResponse.json({ message: e.message || "Internal Server Error" }, { status: 500 });
    }
}
