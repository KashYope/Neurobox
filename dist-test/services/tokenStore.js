import { setApiAuthTokens } from './apiClient';
const STORAGE_KEYS = {
    partner: 'neurobox_partner_token',
    moderator: 'neurobox_moderator_token'
};
const readToken = (role) => {
    if (typeof window === 'undefined')
        return undefined;
    return window.localStorage.getItem(STORAGE_KEYS[role]) || undefined;
};
export const loadStoredTokens = () => {
    const partnerToken = readToken('partner');
    const moderatorToken = readToken('moderator');
    const tokens = {};
    if (partnerToken)
        tokens.partnerToken = partnerToken;
    if (moderatorToken)
        tokens.moderatorToken = moderatorToken;
    return tokens;
};
export const persistToken = (role, token) => {
    if (typeof window === 'undefined')
        return;
    if (!token) {
        window.localStorage.removeItem(STORAGE_KEYS[role]);
    }
    else {
        window.localStorage.setItem(STORAGE_KEYS[role], token);
    }
    setApiAuthTokens(loadStoredTokens());
};
if (typeof window !== 'undefined') {
    setApiAuthTokens(loadStoredTokens());
    window.addEventListener('storage', event => {
        if (!event.key)
            return;
        if (Object.values(STORAGE_KEYS).includes(event.key)) {
            setApiAuthTokens(loadStoredTokens());
        }
    });
}
