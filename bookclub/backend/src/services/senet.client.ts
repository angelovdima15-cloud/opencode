import axios, { AxiosInstance } from 'axios';

interface SenetConfig {
  apiUrl: string;
  token: string;
}

export class SenetClient {
  private client: AxiosInstance;
  private config: SenetConfig;

  constructor(config: SenetConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 5000,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getWorkstations(clubId?: number) {
    const params = clubId ? { club_id: clubId } : undefined;
    const response = await this.client.get('/workstations/', { params });
    return response.data;
  }

  async loginUser(workstationId: string, userId: string) {
    const response = await this.client.post('/workstations/login/', {
      workstation_id: workstationId,
      user_id: userId,
    });
    return response.data;
  }

  async createUser(phone: string, name?: string) {
    const response = await this.client.post('/users/', {
      phone,
      name: name || 'Guest',
    });
    return response.data;
  }

  async refillUserBalance(userId: string, amount: number) {
    const response = await this.client.post('/users/refill/', {
      user_id: userId,
      amount,
    });
    return response.data;
  }
}
