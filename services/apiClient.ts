import { Exercise, ServerExercise } from '../types';

const DEFAULT_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  '/api';

interface ApiConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface CreateExercisePayload extends Exercise {}

export type MutationPayload =
  | { type: 'createExercise'; exercise: Exercise }
  | { type: 'thankExercise'; exerciseId: string };

class ApiClient {
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor({ baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch }: ApiConfig = {}) {
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
