// powerbi-analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ClientSecretCredential } from '@azure/identity';

@Injectable()
export class PowerBIService {
  private readonly apiUrl = 'https://api.powerbi.com/v1.0/myorg';
  private credential: ClientSecretCredential;
  private readonly logger = new Logger(PowerBIService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    // Log environment variables (masked)
    const tenantId = this.configService.get<string>('TENANT_ID');
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');

    this.logger.debug(`TenantID length: ${tenantId?.length}`);
    this.logger.debug(`ClientID length: ${clientId?.length}`);
    this.logger.debug(`ClientSecret length: ${clientSecret?.length}`);

    try {
      this.credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret
      );
      this.logger.debug('Credential object created successfully');
    } catch (error) {
      this.logger.error('Failed to create credential object:', error.message);
      throw error;
    }
  }

  // private async getAccessToken(): Promise<string> {
  //   try {
  //     this.logger.debug('Attempting to get access token...');
  //     const token = await this.credential.getToken(
  //       'https://analysis.windows.net/powerbi/api/.default'
  //     );
  //     this.logger.debug('Successfully obtained access token');
  //     return token.token;
  //   } catch (error) {
  //     this.logger.error('Failed to get access token:', error.message);
  //     throw error;
  //   }
  // }

  // async getWorkspaces() {
  //   try {
  //     this.logger.debug('Getting access token for workspaces request...');
  //     const token = await this.getAccessToken();
      
  //     this.logger.debug('Making request to Power BI API...');
  //     const response = await this.httpService.axiosRef.get(
  //       `${this.apiUrl}/groups`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`
  //         }
  //       }
  //     );
      
  //     this.logger.debug('Successfully retrieved workspaces');
  //     return response.data.value;
  //   } catch (error) {
  //     if (error.response) {
  //       // The request was made and the server responded with a status code
  //       // that falls out of the range of 2xx
  //       this.logger.error(`API Error Status: ${error.response.status}`);
  //       this.logger.error('API Error Data:', error.response.data);
  //       this.logger.error('API Error Headers:', error.response.headers);
  //     } else if (error.request) {
  //       // The request was made but no response was received
  //       this.logger.error('No response received from API');
  //       this.logger.error(error.request);
  //     } else {
  //       // Something happened in setting up the request that triggered an Error
  //       this.logger.error('Error setting up request:', error.message);
  //     }
  //     throw new Error(`Failed to get workspaces: ${error.message}`);
  //   }
  // }


  private async getAccessToken(): Promise<string> {
    try {
      this.logger.debug('Attempting to get access token...');
      const token = await this.credential.getToken(
        'https://analysis.windows.net/powerbi/api/.default'
      );
      // Log first few characters of token for debugging
      this.logger.debug(`Token starts with: ${token.token.substring(0, 10)}...`);
      this.logger.debug(`Token expires in: ${token.expiresOnTimestamp}`);
      return token.token;
    } catch (error) {
      this.logger.error('Failed to get access token:', error.message);
      throw error;
    }
  }
  
  async getWorkspaces() {
    try {
      this.logger.debug('Getting access token for workspaces request...');
      const token = await this.getAccessToken();
      
      this.logger.debug('Making request to Power BI API...');
      const url = `${this.apiUrl}/groups`;
      this.logger.debug(`Request URL: ${url}`);
      this.logger.debug('Request Headers:', {
        Authorization: `Bearer ${token.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      });
  
      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      this.logger.debug('Successfully retrieved workspaces');
      return response.data.value;
    } catch (error) {
      if (error.response) {
        this.logger.error(`API Error Status: ${error.response.status}`);
        this.logger.error('API Error Data:', error.response.data);
        this.logger.error('API Response Headers:', JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        this.logger.error('No response received from API');
        this.logger.error(error.request);
      } else {
        this.logger.error('Error setting up request:', error.message);
      }
      throw new Error(`Failed to get workspaces: ${error.message}`);
    }
  }
}