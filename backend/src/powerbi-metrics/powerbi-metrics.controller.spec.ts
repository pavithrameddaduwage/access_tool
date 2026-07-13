import { Test, TestingModule } from '@nestjs/testing';
import { PowerBIMetricsController } from './powerbi-metrics.controller';
import { PowerBIMetricsService } from './powerbi-metrics.service';

describe('PowerBIMetricsController', () => {
  let controller: PowerBIMetricsController;
  let service: Partial<PowerBIMetricsService>;

  beforeEach(async () => {
    service = {
      getWorkspaceMembers: jest.fn(),
      addWorkspaceMember: jest.fn(),
      updateWorkspaceMember: jest.fn(),
      removeWorkspaceMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PowerBIMetricsController],
      providers: [{ provide: PowerBIMetricsService, useValue: service }],
    }).compile();

    controller = module.get<PowerBIMetricsController>(PowerBIMetricsController);
  });

  it('delegates workspace member listing to the service', async () => {
    (service.getWorkspaceMembers as jest.Mock).mockResolvedValue([{ emailAddress: 'user@contoso.com' }]);

    const result = await controller.getWorkspaceMembers('group-123');

    expect(service.getWorkspaceMembers).toHaveBeenCalledWith('group-123');
    expect(result).toEqual([{ emailAddress: 'user@contoso.com' }]);
  });

  it('delegates adding a workspace member to the service', async () => {
    (service.addWorkspaceMember as jest.Mock).mockResolvedValue({ success: true });

    const result = await controller.addWorkspaceMember('group-123', {
      emailAddress: 'user@contoso.com',
      accessRight: 'Viewer',
    });

    expect(service.addWorkspaceMember).toHaveBeenCalledWith('group-123', {
      emailAddress: 'user@contoso.com',
      accessRight: 'Viewer',
    });
    expect(result).toEqual({ success: true });
  });
});
