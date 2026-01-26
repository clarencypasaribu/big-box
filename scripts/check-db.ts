
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking database tables...");
        const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'task_comments';
    `;
        console.log("Table check result:", result);

        // Check columns
        const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'task_comments';
    `;
        console.log("Columns:", columns);

    } catch (error) {
        console.error("Error checking DB:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
