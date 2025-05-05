import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMapping } from './entities/user-mapping.entity';

@Injectable()
export class UserMappingsService {
  constructor(
    @InjectRepository(UserMapping)
    private readonly userMappingRepo: Repository<UserMapping>,
  ) {}

  // Find a mapping by email
  async findByEmail(email: string): Promise<UserMapping | null> {
    // console.log(`Fetching mapping for email: ${email}`); // Debugging
    const result = await this.userMappingRepo.findOne({ where: { email } });
    // console.log('Query result:', result); // Debugging
    return result;
  }
  // Create or update a mapping
  async upsert(email: string, realName: string): Promise<UserMapping> {
    // console.log(`Upserting mapping for email: ${email}, realName: ${realName}`); // Debugging
    let mapping = await this.findByEmail(email);
    if (mapping) {
      // console.log('Updating existing mapping:', mapping); // Debugging
      mapping.real_name = realName; // Update existing mapping
    } else {
      // console.log('Creating new mapping for email:', email); // Debugging
      mapping = this.userMappingRepo.create({ email, real_name: realName }); // Create new mapping
    }
    const savedMapping = await this.userMappingRepo.save(mapping);
    // console.log('Saved mapping:', savedMapping); // Debugging
    return savedMapping;
  }

  // Get all mappings (optional)
  async findAll(): Promise<UserMapping[]> {
    return this.userMappingRepo.find();
  }
}