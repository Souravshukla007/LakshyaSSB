const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.currentAffair.findMany({ take: 5 });
  console.log('Database Articles:', JSON.stringify(articles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
