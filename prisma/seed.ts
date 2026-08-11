import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing templates
  await prisma.serviceTemplate.deleteMany();

  // Create templates
  const templates = await prisma.serviceTemplate.createMany({
    data: [
      {
        name: 'Netflix',
        logoUrl: 'https://www.netflix.com/favicon.ico',
      },
      {
        name: 'YouTube Premium',
        logoUrl: 'https://www.youtube.com/favicon.ico',
      },
      {
        name: 'Spotify',
        logoUrl: 'https://www.spotify.com/favicon.ico',
      },
    ],
  });

  console.log(`Created ${templates.count} service templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
