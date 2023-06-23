import { Expose, Type } from 'class-transformer';

export class ProfileSkillOutputDto {
  @Expose()
  hours: number;

  @Expose()
  skillId: number;
}
