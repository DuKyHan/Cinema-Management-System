import { faker as fakerEn } from '@faker-js/faker/locale/en';
import { faker as fakerVi } from '@faker-js/faker/locale/vi';
import { Account } from '@prisma/client';
import * as _ from 'lodash';

let accountId = 1;
let organizationId = 1;
let locationId = 1;
let contactId = 1;
let memberId = 1;
let activityId = 1;
let shiftId = 1;
let shiftVolunteerId = 1;
let fileId = 1;
let accountVerificationId = 1;
let accountBanId = 1;
let skillId = 1;
let roleId = 1;

export const getNextAccountId = () => accountId++;
export const getNextOrganizationId = () => organizationId++;
export const getNextLocationId = () => locationId++;
export const getNextContactId = () => contactId++;
export const getNextMemberId = () => memberId++;
export const getNextActivityId = () => activityId++;
export const getNextShiftId = () => shiftId++;
export const getNextShiftVolunteerId = () => shiftVolunteerId++;
export const getNextFileId = () => fileId++;
export const getNextAccountVerificationId = () => accountVerificationId++;
export const getNextAccountBanId = () => accountBanId++;
export const getNextSkillId = () => skillId++;
export const getNextRoleId = () => roleId++;

export const requireNonNullish = <T>(
  value: T | null | undefined,
  message = 'Value is null',
) => {
  if (value == null) {
    throw new Error(message);
  }
  return value;
};

export const randomDate = () => {
  return fakerVi.date.between('2018-01-01', new Date());
};

export const generateViName = (
  genderName: 'male' | 'female',
): { firstName: string; lastName: string } => {
  let firstName = fakerVi.person.lastName(genderName);
  let lastName = fakerVi.person.firstName(genderName);

  const parts = lastName.split(' ');
  if (parts.length > 1) {
    firstName += ' ' + parts[0];
  }
  lastName = parts[parts.length - 1];

  return {
    firstName,
    lastName,
  };
};

export const generateViLocation = () => ({
  id: getNextLocationId(),
  addressLine1: fakerVi.location.streetAddress(false),
  addressLine2: fakerVi.location.secondaryAddress(),
  locality: fakerVi.location.street(),
  region: fakerVi.location.city(),
  country: 'VN',
  latitude: fakerVi.location.latitude(),
  longitude: fakerVi.location.longitude(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const generateEnLocation = () => ({
  id: getNextLocationId(),
  addressLine1: fakerEn.location.streetAddress(false),
  addressLine2: fakerEn.location.secondaryAddress(),
  locality: fakerEn.location.city(),
  region: fakerEn.location.state(),
  country: 'US',
  latitude: fakerEn.location.latitude(),
  longitude: fakerEn.location.longitude(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const generateViContact = () => ({
  id: getNextContactId(),
  name: fakerVi.person.fullName(),
  email: fakerVi.internet.exampleEmail(),
  phoneNumber: fakerVi.phone.number('+84#########'),
});

export const generateEnContact = () => ({
  id: getNextContactId(),
  name: fakerEn.person.fullName(),
  email: fakerEn.internet.exampleEmail(),
  phoneNumber: fakerEn.phone.number('+84#########'),
});

export const capitalizeWords = (s: string) => {
  return s.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
};

export enum FileSizeUnit {
  B = 'B',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
  TB = 'TB',
}

export function normalizeFileSize(size: number): {
  size: number;
  unit: FileSizeUnit;
} {
  const units = Object.values(FileSizeUnit);
  let unitIndex = 0;
  while (size > 1000 && unitIndex < units.length) {
    size /= 1000;
    unitIndex++;
  }
  return { size, unit: units[unitIndex] };
}
