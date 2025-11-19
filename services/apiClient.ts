import { Exercise, ServerExercise } from '../types';

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

interface ApiConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface CreateExercisePayload extends Exercise {}

export type MutationPayload =
  | { type: 'createExercise'; exercise: Exercise }
  | { type: 'thankExercise'; exerciseId: string };

const defaultFetchImpl = (...args: Parameters<typeof fetch>) => {
  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in this environment');
  }
  return fetch(...args);
};

class ApiClient {
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor({ baseUrl = DEFAULT_BASE_URL, fetchImpl = defaultFetchImpl }: ApiConfig = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
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
    return this.request<ServerExercise>('/exercises', {
      method: 'POST',
      body: JSON.stringify(exercise)
    });
  }

  async thankExercise(exerciseId: string): Promise<ServerExercise> {
    return this.request<ServerExercise>(`/exercises/${exerciseId}/thanks`, {
      method: 'POST'
    });
  }
}

export const apiClient = new ApiClient();

export type ApiClientType = ApiClient;
