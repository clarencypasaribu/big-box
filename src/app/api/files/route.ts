import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/utils/supabase-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
        return NextResponse.json({ message: "File ID required" }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient({ allowWrite: false });
    const { data: file, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", fileId)
        .single();

    if (error || !file) {
        return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    // Expecting data to be "data:contentType;base64,....."
    const [meta, base64Data] = (file.data || "").split(",");
    if (!base64Data) {
        return NextResponse.json({ message: "Invalid file data" }, { status: 500 });
    }

    const buffer = Buffer.from(base64Data, "base64");

    const headers = new Headers();
    headers.set("Content-Type", file.type || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${file.name}"`);
    headers.set("Content-Length", buffer.length.toString());

    return new NextResponse(buffer, {
        status: 200,
        headers,
    });
}
