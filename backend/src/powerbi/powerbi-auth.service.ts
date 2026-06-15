import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PowerBiAuthService {
  private readonly logger = new Logger(PowerBiAuthService.name);
  private accessToken: string | null = null;
  private tokenExpiryTime: number | null = null; // Timestamp in ms

  constructor(private configService: ConfigService) {}

  async getToken(): Promise<string> {
    // If token exists and is not expiring in the next 5 minutes (300,000 ms), return cached token
    const now = Date.now();
    if (this.accessToken && this.tokenExpiryTime && this.tokenExpiryTime - now > 300000) {
      return this.accessToken;
    }

    this.logger.log('Power BI access token missing or expiring soon. Fetching new token...');
    await this.refreshToken();
    return this.accessToken;
  }

  private async refreshToken(): Promise<void> {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');
    const scope = this.configService.get<string>('POWER_BI_SCOPE', 'https://analysis.windows.net/powerbi/api/.default');
    const authUrl = this.configService.get<string>('AUTH_URL', 'https://login.microsoftonline.com');

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Azure AD credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are not fully configured in environment variables.');
    }

    const url = `${authUrl}/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', scope);

    try {
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, expires_in } = response.data;
      this.accessToken = access_token;
      // expires_in is in seconds; convert to ms and set expiry time
      this.tokenExpiryTime = Date.now() + expires_in * 1000;
      this.logger.log(`Power BI token successfully fetched. Expires in ${expires_in} seconds.`);
    } catch (error) {
      this.logger.error('Failed to fetch Power BI OAuth2 token', error.response?.data || error.message);
      throw error;
    }
  }
}
