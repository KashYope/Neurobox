const resolveBaseUrl = () => {
    try {
        if (typeof import.meta !== 'undefined') {
            const meta = import.meta;
            return meta.env?.VITE_API_BASE_URL;
        }
    }
    catch {
        // ignore when running outside of a bundler context
    }
    return undefined;
};
const DEFAULT_BASE_URL = resolveBaseUrl() || '/api';
const defaultFetchImpl = (...args) => {
    if (typeof fetch !== 'function') {
        throw new Error('Fetch API is not available in this environment');
    }
    return fetch(...args);
};
class ApiClient {
    constructor({ baseUrl = DEFAULT_BASE_URL, fetchImpl = defaultFetchImpl } = {}) {
        this.authTokens = {};
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.fetchImpl = fetchImpl;
    }
    setAuthTokens(tokens) {
        this.authTokens = { ...this.authTokens, ...tokens };
    }
    buildAuthHeader(role) {
        if (!role)
            return {};
        const token = role === 'partner' ? this.authTokens.partnerToken : this.authTokens.moderatorToken;
        if (!token)
            return {};
        return { Authorization: `Bearer ${token}` };
    }
    async request(path, options = {}, role) {
        const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
                ...this.buildAuthHeader(role)
            },
            credentials: 'include', // Important for cookies
            ...options
        });
        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || `API request failed: ${response.status}`);
        }
        if (response.status === 204) {
            return undefined;
        }
        return (await response.json());
    }
    async fetchExercises() {
        return this.request('/exercises');
    }
    async createExercise(exercise) {
        const role = this.authTokens.partnerToken ? 'partner' : undefined;
        return this.request('/exercises', {
            method: 'POST',
            body: JSON.stringify(exercise)
        }, role);
    }
    async thankExercise(exerciseId) {
        return this.request(`/exercises/${exerciseId}/thanks`, {
            method: 'POST'
        });
    }
    async moderateExercise(exerciseId, payload) {
        return this.request(`/exercises/${exerciseId}/moderation`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        }, 'moderator');
    }
    async fetchModerationQueue() {
        return this.request('/moderation/queue', {}, 'moderator');
    }
    async fetchPartners() {
        return this.request('/admin/partners', {}, 'moderator');
    }
    async updatePartnerStatus(id, status) {
        return this.request(`/admin/partners/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        }, 'moderator');
    }
    async approvePartner(id) {
        return this.updatePartnerStatus(id, 'active');
    }
    async rejectPartner(id) {
        return this.updatePartnerStatus(id, 'rejected');
    }
    async fetchAdminMetrics() {
        return this.request('/admin/metrics', {}, 'moderator');
    }
    async startBatchTranslation(payload) {
        return this.request('/admin/batch-translations', {
            method: 'POST',
            body: JSON.stringify(payload)
        }, 'moderator');
    }
    async fetchBatchTranslationStatus(jobId) {
        return this.request(`/admin/batch-translations/${jobId}`, {}, 'moderator');
    }
    async fetchTranslationCoverage(params) {
        const searchParams = new URLSearchParams();
        if (params?.context) {
            searchParams.set('context', params.context);
        }
        if (params?.langs && params.langs.length) {
            searchParams.set('langs', params.langs.join(','));
        }
        const query = searchParams.toString();
        const path = `/admin/translation-coverage${query ? `?${query}` : ''}`;
        return this.request(path, {}, 'moderator');
    }
    // Exercise string translation methods
    async fetchExerciseStrings(context) {
        const url = context ? `/strings?context=${encodeURIComponent(context)}` : '/strings';
        return this.request(url);
    }
    async fetchExerciseStringTranslations(lang) {
        return this.request(`/strings/translations/${lang}`);
    }
    async createExerciseString(data) {
        return this.request('/strings', {
            method: 'POST',
            body: JSON.stringify(data)
        }, 'partner');
    }
    async createExerciseStringTranslation(stringId, data) {
        return this.request(`/strings/${stringId}/translations`, {
            method: 'POST',
            body: JSON.stringify(data)
        }, 'partner');
    }
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }
    async register(data) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }
    async getMe() {
        return this.request('/auth/me');
    }
}
export const apiClient = new ApiClient();
export const setApiAuthTokens = (tokens) => apiClient.setAuthTokens(tokens);
