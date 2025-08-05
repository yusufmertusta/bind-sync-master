export interface User {
  id: string;
  email: string;
  name: string;
}

// Mock auth service for demonstration
class AuthService {
  private currentUser: User | null = {
    id: 'user-1',
    email: 'demo@example.com',
    name: 'Demo User'
  };

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  login(email: string, password: string): Promise<User | null> {
    // Mock login
    return Promise.resolve(this.currentUser);
  }

  logout(): void {
    this.currentUser = null;
  }
}

export const authService = new AuthService();