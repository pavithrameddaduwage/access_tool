import { Entity, Column, PrimaryGeneratedColumn, Unique, OneToMany } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';

@Entity() 
@Unique(['webtool']) 
export class Webtool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  webtool: string; 

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Role, (role) => role.webtool)
  roles: Role[]; 
}