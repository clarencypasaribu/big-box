
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Angel Mentari ID from previous step
  const userId = '6f954171-ac40-425c-9ab9-ff222b732063';
  
  // Update the first blocker
  const blockers = await prisma.blockers.findMany({ take: 1 });
  if (blockers.length > 0) {
    const blocker = blockers[0];
    console.log(`Assigning blocker ${blocker.id} to user ${userId}...`);
    
    await prisma.blockers.update({
      where: { id: blocker.id },
      data: {
        assignee_id: userId,
        assignee_name: 'angel mentari'
      }
    });
    console.log("Blocker assigned.");
  } else {
    console.log("No blockers to assign.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
