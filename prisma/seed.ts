import "dotenv/config";
import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL ||= process.env.DIRECT_DATABASE_URL;

const prisma = new PrismaClient();

type SeedTask = {
  seedKey: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  stage?: string;
  dueDate?: string;
};

type SeedProject = {
  name: string;
  tasks: SeedTask[];
};

const projectSeeds: SeedProject[] = [
  {
    name: "Mobile App",
    tasks: [
      {
        seedKey: "mobile-app:stage-1:define-scope",
        title: "Define scope & milestones",
        description: "Align goals, deliverables, and target dates.",
        status: "Completed",
        priority: "Medium",
        stage: "Stage F1: Initiation",
      },
      {
        seedKey: "mobile-app:stage-1:research-requirements",
        title: "Research requirements",
        description: "Gather constraints, risks, and dependencies.",
        status: "Completed",
        priority: "Medium",
        stage: "Stage F1: Initiation",
      },
      {
        seedKey: "mobile-app:stage-2:instalasi-biglake",
        title: "Instalasi BigLake di Server Lokal",
        description: "Brainstorming brings team members' diverse experience into play.",
        status: "Completed",
        priority: "Medium",
        stage: "Stage F2: Planning",
      },
      {
        seedKey: "mobile-app:stage-2:research-1",
        title: "Research",
        description: "Brainstorming brings team members' diverse experience into play.",
        status: "Completed",
        priority: "Medium",
        stage: "Stage F2: Planning",
      },
      {
        seedKey: "mobile-app:stage-3:visualisasi-kependudukan",
        title: "Buat Visualisasi Kependudukan di Big Builder",
        description: "Brainstorming brings team members' diverse experience into play.",
        status: "Active",
        priority: "High",
        stage: "Stage F3: Execution",
      },
      {
        seedKey: "mobile-app:stage-3:config-bigspider",
        title: "Config BigSpider untuk Crawling",
        description: "Brainstorming brings team members' diverse experience into play.",
        status: "Active",
        priority: "Medium",
        stage: "Stage F3: Execution",
      },
      {
        seedKey: "mobile-app:stage-4:test-load-api-bigenvelope",
        title: "Test Load API BigEnvelope",
        description: "Planned: Oct 12",
        status: "Testing",
        priority: "Low",
        stage: "Stage F4: Monitoring & Controlling",
      },
      {
        seedKey: "mobile-app:stage-5:release-checklist",
        title: "Release checklist",
        description: "Final verification before handoff.",
        status: "Active",
        priority: "Medium",
        stage: "Stage F5: Closure",
      },
    ],
  },
  {
    name: "Project BigBox Care",
    tasks: [
      {
        seedKey: "bigbox-care:finance-flow-1",
        title: "Create user flow for Finance App",
        description: "Project BigBox Care",
        status: "In Progress",
        priority: "High",
        dueDate: "Today",
      },
      {
        seedKey: "bigbox-care:finance-flow-2",
        title: "Create user flow for Finance App",
        description: "Project BigBox Care",
        status: "To Do",
        priority: "Low",
        dueDate: "Oct 24th",
      },
      {
        seedKey: "bigbox-care:maze-usability",
        title: "App usability testing with Maze",
        description: "Project BigBox Care",
        status: "In Review",
        priority: "Medium",
        dueDate: "Tomorrow",
      },
      {
        seedKey: "bigbox-care:finance-flow-3",
        title: "Create user flow for Finance App",
        description: "Project BigBox Care",
        status: "To Do",
        priority: "Low",
        dueDate: "Oct 24th",
      },
    ],
  },
];

async function main() {
  for (const projectSeed of projectSeeds) {
    const project =
      (await prisma.project.findFirst({ where: { name: projectSeed.name } })) ??
      (await prisma.project.create({
        data: {
          name: projectSeed.name,
          status: "In Progress",
        },
      }));

    for (const task of projectSeed.tasks) {
      await prisma.task.upsert({
        where: { seedKey: task.seedKey },
        update: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          stage: task.stage,
          dueDate: task.dueDate,
          status: task.status,
          projectId: project.id,
        },
        create: {
          seedKey: task.seedKey,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          stage: task.stage,
          dueDate: task.dueDate,
          projectId: project.id,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
