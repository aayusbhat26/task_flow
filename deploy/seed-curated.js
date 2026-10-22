'use strict';

// Seeds the curated DSA question bank on first boot. Idempotent: skips when
// any curated (non-imported) question already exists.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.dSAQuestion.count({
      where: { isImported: false },
    });

    if (existing > 0) {
      console.log(`[seed] curated DSA questions already present (${existing}), skipping`);
      return;
    }

    const candidates = [
      path.join(__dirname, 'curated-dsa-questions.json'),
      path.join(__dirname, '..', 'prisma', 'seed-data', 'curated-dsa-questions.json'),
    ];
    const file = candidates.find((candidate) => fs.existsSync(candidate));
    if (!file) throw new Error('curated-dsa-questions.json not found');

    const rows = JSON.parse(fs.readFileSync(file, 'utf8')).map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
    }));

    for (let index = 0; index < rows.length; index += 50) {
      await prisma.dSAQuestion.createMany({
        data: rows.slice(index, index + 50),
        skipDuplicates: true,
      });
    }

    const total = await prisma.dSAQuestion.count({
      where: { isImported: false },
    });
    console.log(`[seed] curated DSA questions inserted, total now ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[seed] failed:', error.message);
  process.exitCode = 1;
});
