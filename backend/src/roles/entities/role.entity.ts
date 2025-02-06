import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { Webtool } from 'src/webtool/entities/webtool.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()

  roles: string;

  @Column()
  privileges: string;

  @ManyToOne(() => Webtool, (webtool) => webtool.roles, { nullable: false })
  @JoinColumn({ name: 'webtoolId' })
  webtool: Webtool;
}
