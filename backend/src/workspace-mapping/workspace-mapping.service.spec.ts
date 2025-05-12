import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceMappingService } from './workspace-mapping.service';

describe('WorkspaceMappingService', () => {
  let service: WorkspaceMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceMappingService],
    }).compile();

    service = module.get<WorkspaceMappingService>(WorkspaceMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
