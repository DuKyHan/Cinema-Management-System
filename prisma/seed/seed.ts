import { faker as fakerEn } from '@faker-js/faker/locale/en';
import { faker as fakerVi } from '@faker-js/faker/locale/vi';
import { AppPrismaClient } from 'src/prisma';
import { seedAccountsAndRoles } from './seed-account-role';
import { seedProfiles } from './seed-profile';

fakerEn.seed(1);
fakerVi.seed(1);

const prisma = new AppPrismaClient();

async function main() {
  console.log('🌱 Start seeding...');
  const start = Date.now();
  await prisma.connect();
  await seed();
  console.log(`✅ Seeding finished. Took ${(Date.now() - start) / 1000}s`);
}

const seed = async () => {
  const {
    accounts,
    adminAccounts,
    modAccounts,
    volunteerAccounts,
    defaultAccounts,
  } = await runWithTimer(
    () =>
      seedAccountsAndRoles(prisma, {
        defaultAccountOptions: { include: true },
      }),
    '- Seeding accounts and roles...',
  );

  await runWithTimer(
    () => seedProfiles(prisma, accounts),
    '- Seeding profiles...',
  );

  // Fix sequences
  await runWithTimer(async () => {
    await prisma.$executeRaw`SELECT setval('"Account_id_seq"', (SELECT MAX(id) from "Account"));`;
    await prisma.$executeRaw`SELECT setval('"AccountBan_id_seq"', (SELECT MAX(id) from "AccountBan"));`;
    await prisma.$executeRaw`SELECT setval('"AccountVerification_id_seq"', (SELECT MAX(id) from "AccountVerification"));`;
    await prisma.$executeRaw`SELECT setval('"Role_id_seq"', (SELECT MAX(id) from "Role"));`;
    await prisma.$executeRaw`SELECT setval('"Member_id_seq"', (SELECT MAX(id) from "Member"));`;
    await prisma.$executeRaw`SELECT setval('"Location_id_seq"', (SELECT MAX(id) from "Location"));`;
    await prisma.$executeRaw`SELECT setval('"Contact_id_seq"', (SELECT MAX(id) from "Contact"));`;
    await prisma.$executeRaw`SELECT setval('"File_id_seq"', (SELECT MAX(id) from "File"));`;
  }, 'Fixing sequences...');
};

const runWithTimer = async <T>(
  fn: () => Promise<T>,
  startMessage: string,
): Promise<T> => {
  const start = Date.now();
  console.log(startMessage);
  const res: T = await fn();
  console.log(` |_ ✓ Completed in ${(Date.now() - start) / 1000}s`);
  return res;
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
