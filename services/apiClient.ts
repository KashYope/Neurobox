import { Exercise, ModerationStatus, ServerExercise } from '../types';

type ImportMetaWithEnv = ImportMeta & { env?: Record<string, string | undefined> };

const resolveBaseUrl = (): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined') {
      const meta = import.meta as ImportMetaWithEnv;
      return meta.env?.VITE_API_BASE_URL;
    }
  } catch {
    // ignore when running outside of a bundler context
  }
  return undefined;
};

const DEFAULT_BASE_URL = resolveBaseUrl() || '/api';

type AuthRole = 'partner' | 'moderator';

export interface AuthTokens {
  partnerToken?: string;
  moderatorToken?: string;
}

interface ApiConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface CreateExercisePayload extends Exercise {}

export type MutationPayload =
  | { type: 'createExercise'; exercise: Exercise }
  | { type: 'thankExercise'; exerciseId: string }
  | { type: 'moderateExercise'; exerciseId: string; status: ModerationStatus; notes?: string };

export interface ModerateExercisePayload {
  status: ModerationStatus;
  notes?: string;
  shouldDelete?: boolean;
}

export interface ModerationQueueResponse {
  queue: ServerExercise[];
  recent: ServerExercise[];
}

const defaultFetchImpl = (...args: Parameters<typeof fetch>) => {
  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in this environment');
  }
  return fetch(...args);
};

class ApiClient {
  private baseUrl: string;
  private fetchImpl: typeof fetch;
  private authTokens: AuthTokens = {};

  constructor({ baseUrl = DEFAULT_BASE_URL, fetchImpl = defaultFetchImpl }: ApiConfig = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
  }

  setAuthTokens(tokens: AuthTokens): void {
    this.authTokens = { ...this.authTokens, ...tokens };
  }

  private buildAuthHeader(role?: AuthRole): Record<string, string> {
    if (!role) return {};
    const token = role === 'partner' ? this.authTokens.partnerToken : this.authTokens.moderatorToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  private async request<T>(path: string, options: RequestInit = {}, role?: AuthRole): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...this.buildAuthHeader(role)
      },
      ...options
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `API request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async fetchExercises(): Promise<ServerExercise[]> {
    return this.request<ServerExercise[]>('/exercises');
  }

  async createExercise(exercise: CreateExercisePayload): Promise<ServerExercise> {
    const role: AuthRole | undefined = this.authTokens.partnerToken ? 'partner' : undefined;
    return this.request<ServerExercise>(
      '/exercises',
      {
        method: 'POST',
        body: JSON.stringify(exercise)
      },
      role
    );
  }

  async thankExercise(exerciseId: string): Promise<ServerExercise> {
    return this.request<ServerExercise>(`/exercises/${exerciseId}/thanks`, {
      method: 'POST'
    });
  }

  async moderateExercise(exerciseId: string, payload: ModerateExercisePayload): Promise<ServerExercise> {
    return this.request<ServerExercise>(`/exercises/${exerciseId}/moderation`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }, 'moderator');
  }

  async fetchModerationQueue(): Promise<ModerationQueueResponse> {
    return this.request<ModerationQueueResponse>('/moderation/queue', {}, 'moderator');
  }
}

export const apiClient = new ApiClient();
export const setApiAuthTokens = (tokens: AuthTokens) => apiClient.setAuthTokens(tokens);

export type ApiClientType = ApiClient;
