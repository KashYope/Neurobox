import { setApiAuthTokens, type AuthTokens } from './apiClient';

const STORAGE_KEYS: Record<'partner' | 'moderator', string> = {
  partner: 'neurobox_partner_token',
  moderator: 'neurobox_moderator_token'
};

type TokenRole = keyof typeof STORAGE_KEYS;

const readToken = (role: TokenRole): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(STORAGE_KEYS[role]) || undefined;
};

export const loadStoredTokens = (): AuthTokens => {
  const partnerToken = readToken('partner');
  const moderatorToken = readToken('moderator');
  const tokens: AuthTokens = {};
  if (partnerToken) tokens.partnerToken = partnerToken;
  if (moderatorToken) tokens.moderatorToken = moderatorToken;
  return tokens;
};

export const persistToken = (role: TokenRole, token?: string): void => {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(STORAGE_KEYS[role]);
  } else {
    window.localStorage.setItem(STORAGE_KEYS[role], token);
  }
  setApiAuthTokens(loadStoredTokens());
};

if (typeof window !== 'undefined') {
  setApiAuthTokens(loadStoredTokens());
  window.addEventListener('storage', event => {
    if (!event.key) return;
    if (Object.values(STORAGE_KEYS).includes(event.key)) {
      setApiAuthTokens(loadStoredTokens());
    }
  });
}
