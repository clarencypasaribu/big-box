
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const blockers = await prisma.blockers.findMany();
    console.log("All Blockers:");
    blockers.forEach(b => {
        console.log(`ID: ${b.id}, AssigneeID: ${b.assignee_id}, AssigneeName: ${b.assignee_name}, Title: ${b.title}, Status: ${b.status}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
