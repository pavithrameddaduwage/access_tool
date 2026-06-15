import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { PowerBiAuthService } from './powerbi-auth.service';

@Injectable()
export class PowerBIService {
  private readonly logger = new Logger(PowerBIService.name);
  private readonly baseUrl: string;

  constructor(
    private authService: PowerBiAuthService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('POWER_BI_BASE_URL', 'https://api.powerbi.com/v1.0/myorg');
  }

  // Sleep utility helper
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Call request with automatic retry on 429 rate limit
  private async requestWithRetry<T>(config: AxiosRequestConfig, retries = 3): Promise<AxiosResponse<T>> {
    try {
      const token = await this.authService.getToken();
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
      return await axios(config);
    } catch (error) {
      if (error.response?.status === 429 && retries > 0) {
        const retryAfterHeader = error.response.headers['retry-after'];
        let retryAfterMs = 5000; // Default to 5 seconds if header is missing
        if (retryAfterHeader) {
          const seconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(seconds)) {
            retryAfterMs = seconds * 1000;
          }
        }
        this.logger.warn(`Rate limit (429) hit. Waiting ${retryAfterMs}ms before retrying. Retries remaining: ${retries}`);
        await this.sleep(retryAfterMs);
        return this.requestWithRetry(config, retries - 1);
      }
      throw error;
    }
  }

  // HTTP GET
  async get<T>(url: string, params: any = {}): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const response = await this.requestWithRetry<T>({
      method: 'GET',
      url: fullUrl,
      params,
    });
    return response.data;
  }

  // HTTP POST
  async post<T>(url: string, data: any = {}): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const response = await this.requestWithRetry<T>({
      method: 'POST',
      url: fullUrl,
      data,
    });
    return response.data;
  }

  // Paginated HTTP GET (collects all values across continuation tokens)
  async getPaginated<T = any>(url: string, params: any = {}): Promise<T[]> {
    let results: T[] = [];
    let currentUrl: string | null = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    let currentParams = { ...params };

    while (currentUrl) {
      this.logger.log(`Fetching page: ${currentUrl}`);
      const response = await this.get<any>(currentUrl, currentParams);
      
      // Add items from current page
      if (response && Array.isArray(response.value)) {
        results = results.concat(response.value);
      } else if (response && Array.isArray(response)) {
        results = results.concat(response);
      }

      // Check for continuationToken in the response body or header
      // OData standard uses `@odata.continuationToken` or `continuationToken`
      const continuationToken = response?.['@odata.continuationToken'] || response?.continuationToken;
      if (continuationToken) {
        // Prepare next call
        currentUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        currentParams = { ...params, continuationToken };
      } else {
        currentUrl = null;
      }
    }

    return results;
  }
}
