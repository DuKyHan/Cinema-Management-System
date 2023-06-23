import { Injectable } from '@nestjs/common';
import { AccountVerification, Prisma } from '@prisma/client';
import { AccountNotFoundException } from 'src/auth/exceptions/account-not-found.exception';
import { AppLogger } from 'src/common/logger';
import { RequestContext } from 'src/common/request-context';
import { AbstractService } from 'src/common/services';
import { PrismaService } from 'src/prisma';
import { AccountVerificationStatus } from '../constants';
import {
  AccountVerificationOutputDto,
  CreateAccountVerificationInputDto,
  GetAccountVerificationInclude,
  GetAccountVerificationQueryDto,
  GetAccountVerificationsQueryDto,
} from '../dtos';
import {
  AccountAlreadyVerifiedException,
  AccountIsAlreadyAwaitingVerificationException,
  AccountVerificationIsBlockedException,
  NoBlockedAccountVerificationException,
  NoPendingAccountVerificationException,
} from '../exceptions';

@Injectable()
export class AccountVerificationService extends AbstractService {
  constructor(logger: AppLogger, private readonly prisma: PrismaService) {
    super(logger);
  }

  async getVerificationRequests(
    context: RequestContext,
    query: GetAccountVerificationsQueryDto,
  ): Promise<AccountVerificationOutputDto[]> {
    this.logCaller(context, this.getVerificationRequests);

    const verificationRequests = await this.prisma.accountVerification.findMany(
      {
        where: this.getFilter(query),
        include: this.getInclude(query),
      },
    );

    return verificationRequests.map((verificationRequest) =>
      this.mapToDto(verificationRequest),
    );
  }

  async getVerificationRequestById(
    context: RequestContext,
    id: number,
    query: GetAccountVerificationQueryDto,
  ): Promise<AccountVerificationOutputDto | null> {
    this.logCaller(context, this.getVerificationRequestById);

    const res = await this.prisma.accountVerification.findUnique({
      where: {
        id: id,
      },
      include: this.getInclude(query),
    });

    if (res == null) {
      return null;
    }

    return this.mapToDto(res);
  }

  async createVerificationRequest(
    context: RequestContext,
    dto: CreateAccountVerificationInputDto,
    query: GetAccountVerificationsQueryDto,
  ): Promise<AccountVerificationOutputDto> {
    this.logCaller(context, this.createVerificationRequest);

    const account = await this.prisma.account.findUnique({
      where: { id: context.account.id },
    });
    if (!account) {
      throw new AccountNotFoundException();
    }

    if (account.isAccountVerified) {
      throw new AccountAlreadyVerifiedException();
    }

    const existingVerificationRequest =
      await this.prisma.accountVerification.findFirst({
        where: {
          accountId: account.id,
          status: {
            in: [
              AccountVerificationStatus.Pending,
              AccountVerificationStatus.Blocked,
            ],
          },
        },
      });
    if (
      existingVerificationRequest?.status == AccountVerificationStatus.Pending
    ) {
      throw new AccountIsAlreadyAwaitingVerificationException();
    } else if (
      existingVerificationRequest?.status == AccountVerificationStatus.Blocked
    ) {
      throw new AccountVerificationIsBlockedException();
    }

    const verificationRequest = await this.prisma.accountVerification.create({
      data: {
        accountId: account.id,
        status: AccountVerificationStatus.Pending,
        isVerified: false,
        content: dto.content,
        accountVerificationFile: dto.files && {
          createMany: {
            data: dto.files?.map((file) => ({ fileId: file })),
          },
        },
      },
      include: this.getInclude(query),
    });

    return this.mapToDto(verificationRequest);
  }

  async blockVerificationRequest(context: RequestContext, id: number) {
    this.logCaller(context, this.blockVerificationRequest);

    const existingVerificationRequest =
      await this.prisma.accountVerification.findFirst({
        where: {
          id: id,
          status: AccountVerificationStatus.Pending,
        },
      });
    if (
      existingVerificationRequest?.status != AccountVerificationStatus.Pending
    ) {
      throw new NoPendingAccountVerificationException();
    }

    return this.prisma.accountVerification.update({
      where: { id: id },
      data: {
        status: AccountVerificationStatus.Blocked,
        performedBy: context.account.id,
      },
    });
  }

  async unblockVerificationRequest(context: RequestContext, id: number) {
    this.logCaller(context, this.unblockVerificationRequest);

    const existingVerificationRequest =
      await this.prisma.accountVerification.findFirst({
        where: {
          id: id,
          status: AccountVerificationStatus.Blocked,
        },
      });
    if (existingVerificationRequest == null) {
      throw new NoBlockedAccountVerificationException();
    }

    return this.prisma.accountVerification.update({
      where: { id: id },
      data: {
        status: AccountVerificationStatus.Pending,
        performedBy: context.account.id,
      },
    });
  }

  getFilter(query: GetAccountVerificationsQueryDto) {
    const filter: Prisma.AccountVerificationWhereInput = {};
    if (query.id) {
      filter.id = {
        in: query.id,
      };
    }
    if (query.accountId) {
      filter.accountId = query.accountId;
    }
    if (query.status) {
      filter.status = {
        in: query.status,
      };
    }
    return filter;
  }

  getInclude(query: GetAccountVerificationsQueryDto) {
    const include: Prisma.AccountVerificationInclude = {};
    if (query.include?.includes(GetAccountVerificationInclude.File)) {
      include.accountVerificationFile = {
        include: {
          file: true,
        },
      };
    }
    if (Object.keys(include).length === 0) {
      return undefined;
    }
    return include;
  }

  mapToDto(raw: AccountVerification & any): AccountVerificationOutputDto {
    const res = {
      ...raw,
      files: raw.accountVerificationFile?.map((file) => file.file),
    };
    return this.output(AccountVerificationOutputDto, res);
  }
}
