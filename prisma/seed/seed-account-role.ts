import { faker as fakerEn } from '@faker-js/faker/locale/en';
import { faker as fakerVi } from '@faker-js/faker/locale/vi';
import {
  Account,
  AccountBan,
  AccountRole,
  AccountVerification,
  PrismaClient,
  Role,
} from '@prisma/client';
import { hashSync } from 'bcrypt';
import { AccountVerificationStatus } from 'src/account-verification/constants';
import { Role as RoleEnum } from '../../src/auth/constants';
import {
  getNextAccountBanId,
  getNextAccountId,
  getNextAccountVerificationId,
  getNextRoleId,
} from './utils';

export class SeedAccountsAndRolesOptions {
  defaultAccountOptions?: {
    include?: boolean;
    roles?: RoleEnum[];
  };
  numberOfOpAccounts?: number;
  numberOfModAccounts?: number;
  numberOfAdminAccounts?: number;
  numberOfVolunteerAccounts?: number;
}

export const seedAccountsAndRoles = async (
  prisma: PrismaClient,
  options?: SeedAccountsAndRolesOptions,
) => {
  const roles: Role[] = [
    {
      id: getNextRoleId(),
      name: RoleEnum.User,
      description: 'User',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: getNextRoleId(),
      name: RoleEnum.Moderator,
      description: 'Moderator',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: getNextRoleId(),
      name: RoleEnum.Admin,
      description: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: getNextRoleId(),
      name: RoleEnum.Operator,
      description: 'Operator',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const getRoleByName = (name: RoleEnum) => {
    const role = roles.find((role) => role.name === name);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  };

  const hashedPassword = hashSync('123456', 10);

  const defaultAccounts: Account[] = [];
  if (options?.defaultAccountOptions?.include === true) {
    const acc1 = {
      id: getNextAccountId(),
      email: 'hquan310@gmail.com',
      password: hashedPassword,
      isAccountVerified: false,
      isAccountDisabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    defaultAccounts.push(acc1);
  }

  const opAccounts = Array.from({
    length: options?.numberOfOpAccounts ?? 5,
  }).map((_, index) => ({
    id: getNextAccountId(),
    email: `op${index}@a.com`,
    password: hashedPassword,
    isAccountVerified: false,
    isAccountDisabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const modAccounts = Array.from({
    length: options?.numberOfModAccounts ?? 30,
  }).map((_, index) => ({
    id: getNextAccountId(),
    email: `mod${index}@a.com`,
    password: hashedPassword,
    isAccountVerified: false,
    isAccountDisabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const adminAccounts = Array.from({
    length: options?.numberOfAdminAccounts ?? 30,
  }).map((_, index) => ({
    id: getNextAccountId(),
    email: `admin${index}@a.com`,
    password: hashedPassword,
    isAccountVerified: false,
    isAccountDisabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const verificationList: AccountVerification[] = [];
  const banList: AccountBan[] = [];

  const volunteerAccounts = Array.from({
    length: options?.numberOfVolunteerAccounts ?? 100,
  }).map((_, i) => {
    const accountId = 300 + i;

    const createdAt = fakerVi.date.between({
      from: '2018-01-01',
      to: new Date(),
    });
    const updatedAt = fakerVi.date.between({ from: createdAt, to: new Date() });

    const isAccountVerified = fakerVi.datatype.boolean();
    const isAccountDisabled = fakerVi.datatype.boolean();

    let ca: Date;
    // Has no pending verification
    if (isAccountVerified && fakerVi.datatype.boolean()) {
      // Random number of verification
      for (let i = 0; i < fakerVi.number.int({ min: 0, max: 3 }); i++) {
        const ca = fakerVi.date.soon({ days: 14, refDate: createdAt });
        verificationList.push({
          id: getNextAccountVerificationId(),
          accountId: accountId,
          performedBy: fakerVi.helpers.arrayElement(adminAccounts).id,
          note: fakerEn.lorem.lines(),
          isVerified: fakerVi.datatype.boolean(),
          status: AccountVerificationStatus.Completed,
          content: fakerEn.lorem.paragraphs(),
          createdAt: ca,
          updatedAt: ca,
        });
      }

      // The last verification must match the account verification status
      ca = fakerVi.date.soon({ days: 14, refDate: createdAt });
      verificationList.push({
        id: getNextAccountVerificationId(),
        accountId: accountId,
        performedBy: fakerVi.helpers.arrayElement(adminAccounts).id,
        note: fakerEn.lorem.lines(),
        isVerified: isAccountVerified,
        status: AccountVerificationStatus.Completed,
        content: fakerEn.lorem.paragraphs(),
        createdAt: ca,
        updatedAt: ca,
      });
    } else {
      // Has pending verification
      ca = fakerVi.date.soon({ days: 14, refDate: createdAt });
      verificationList.push({
        id: getNextAccountVerificationId(),
        accountId: accountId,
        performedBy: fakerVi.helpers.arrayElement(adminAccounts).id,
        note: fakerEn.lorem.lines(),
        isVerified: false,
        status: AccountVerificationStatus.Pending,
        content: fakerEn.lorem.paragraphs(),
        createdAt: ca,
        updatedAt: ca,
      });
    }

    // Random number of ban
    if (isAccountDisabled) {
      for (let i = 0; i < fakerVi.number.int({ min: 0, max: 3 }); i++) {
        const ca = fakerVi.date.soon({ days: 14, refDate: createdAt });
        banList.push({
          id: getNextAccountBanId(),
          accountId: accountId,
          performedBy: fakerVi.helpers.arrayElement(adminAccounts).id,
          note: fakerEn.lorem.lines(),
          isBanned: fakerVi.datatype.boolean(),
          createdAt: ca,
          updatedAt: ca,
        });
      }

      ca = fakerVi.date.soon({ days: 14, refDate: createdAt });
      banList.push({
        id: getNextAccountBanId(),
        accountId: accountId,
        performedBy: fakerVi.helpers.arrayElement(adminAccounts).id,
        note: fakerEn.lorem.lines(),
        isBanned: isAccountDisabled,
        createdAt: ca,
        updatedAt: ca,
      });
    }

    return {
      id: accountId,
      email: fakerVi.internet.exampleEmail(),
      password: hashedPassword,
      isAccountVerified: fakerVi.datatype.boolean(),
      isAccountDisabled: fakerVi.datatype.boolean(),
      createdAt: createdAt,
      updatedAt: updatedAt,
    };
  });

  const accounts: Account[] = [
    ...opAccounts,
    ...modAccounts,
    ...adminAccounts,
    ...volunteerAccounts,
    ...defaultAccounts,
  ];

  const defaultAccountRoles: AccountRole[] = defaultAccounts.flatMap(
    (account) =>
      (
        options?.defaultAccountOptions?.roles ?? [
          RoleEnum.Operator,
          RoleEnum.Admin,
          RoleEnum.Moderator,
        ]
      ).map((role) => ({
        accountId: account.id,
        roleId: getRoleByName(role).id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
  );

  const accountRoles: AccountRole[] = [
    ...defaultAccountRoles,
    ...opAccounts.map((account) => ({
      accountId: account.id,
      roleId: getRoleByName(RoleEnum.Operator).id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    ...modAccounts.map((account) => ({
      accountId: account.id,
      roleId: getRoleByName(RoleEnum.Moderator).id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    ...adminAccounts.map((account) => ({
      accountId: account.id,
      roleId: getRoleByName(RoleEnum.Admin).id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  ];
  accounts.forEach((account) => {
    accountRoles.push({
      accountId: account.id,
      roleId: getRoleByName(RoleEnum.User).id,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  });

  await prisma.role.createMany({
    data: roles,
  });

  await prisma.account.createMany({
    data: accounts,
  });

  await prisma.accountRole.createMany({
    data: accountRoles,
  });

  await prisma.accountVerification.createMany({
    data: verificationList,
  });

  await prisma.accountBan.createMany({
    data: banList,
  });

  return {
    roles,
    accountRoles,
    adminAccounts,
    modAccounts,
    volunteerAccounts,
    defaultAccounts,
    accounts,
  };
};
