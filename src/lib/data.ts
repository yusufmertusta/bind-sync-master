export interface Domain {
  id: string;
  domainName: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
  updatedAt: string;
  recordCount: number;
  userId: string;
}

export interface CreateDomainData {
  userId: string;
  domainName: string;
  status: 'active' | 'pending' | 'inactive';
}

// Mock data service for demonstration
class DataService {
  private domains: Domain[] = [];

  async getDomainsByUserId(userId: string): Promise<Domain[]> {
    return this.domains.filter(domain => domain.userId === userId);
  }

  async createDomain(data: CreateDomainData): Promise<Domain> {
    const newDomain: Domain = {
      id: Math.random().toString(36).substr(2, 9),
      domainName: data.domainName,
      status: data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recordCount: 0,
      userId: data.userId
    };
    
    this.domains.push(newDomain);
    return newDomain;
  }

  async deleteDomain(id: string): Promise<boolean> {
    const index = this.domains.findIndex(domain => domain.id === id);
    if (index !== -1) {
      this.domains.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const dataService = new DataService();