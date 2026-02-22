import { Dropbox } from 'dropbox';

const CLIENT_ID = ''; // User must set their own Dropbox App Key

// Redirect URI moet EXACT overeenkomen met wat in Dropbox App Console staat
function getRedirectUri() {
  const origin = window.location.origin;
  return origin + '/';
}

export function getRedirectUri_ForDisplay() {
  return getRedirectUri();
}

const FILE_PATH = '/lijst.json';
const ACCESS_TOKEN_KEY = 'dbx_access_token';
const REFRESH_TOKEN_KEY = 'dbx_refresh_token';
const TOKEN_EXPIRY_KEY = 'dbx_token_expiry';
const VERIFIER_KEY = 'dbx_code_verifier';
const CLIENT_ID_KEY = 'dbx_client_id';

function getClientId() {
  return localStorage.getItem(CLIENT_ID_KEY) || CLIENT_ID;
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Token opslag
function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getTokenExpiry() {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : 0;
}

function storeTokens(accessToken, refreshToken, expiresIn) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  // Sla expiry op met 5 minuten marge
  const expiryTime = Date.now() + (expiresIn - 300) * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

export function getStoredToken() {
  // Backwards compatible - check of er een token is
  return getStoredAccessToken() || getStoredRefreshToken();
}

export function setStoredToken(token) {
  // Backwards compatible voor shared tokens
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

export function setClientId(id) {
  localStorage.setItem(CLIENT_ID_KEY, id);
}

export function getStoredClientId() {
  return localStorage.getItem(CLIENT_ID_KEY) || '';
}

// Refresh het access token met de refresh token
async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  const clientId = getClientId();

  if (!refreshToken || !clientId) {
    throw new Error('Geen refresh token beschikbaar');
  }

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    // Refresh token is ook ongeldig - volledig uitloggen
    clearStoredToken();
    const error = new Error('Sessie verlopen');
    error.code = 'TOKEN_EXPIRED';
    throw error;
  }

  const data = await response.json();
  // Refresh token blijft hetzelfde, alleen access token wordt vernieuwd
  storeTokens(data.access_token, null, data.expires_in);
  return data.access_token;
}

// Haal een geldig access token op (vernieuwt automatisch indien nodig)
async function getValidAccessToken() {
  const accessToken = getStoredAccessToken();
  const expiry = getTokenExpiry();

  // Check of token nog geldig is
  if (accessToken && Date.now() < expiry) {
    return accessToken;
  }

  // Token verlopen of bijna verlopen - probeer te vernieuwen
  const refreshToken = getStoredRefreshToken();
  if (refreshToken) {
    return await refreshAccessToken();
  }

  // Geen refresh token - gebruiker moet opnieuw inloggen
  if (accessToken) {
    // Er is wel een access token maar geen refresh token (oude sessie of shared token)
    return accessToken;
  }

  throw new Error('Niet ingelogd');
}

export async function startAuth() {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error('Stel eerst een Dropbox App Key in.');
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: getRedirectUri(),
    token_access_type: 'offline', // Dit geeft ons een refresh_token!
  });

  window.location.href = `https://www.dropbox.com/oauth2/authorize?${params}`;
}

export async function handleAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const verifier = localStorage.getItem(VERIFIER_KEY);

  if (!code || !verifier) return null;

  const clientId = getClientId();
  if (!clientId) return null;

  try {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        code_verifier: verifier,
        client_id: clientId,
        redirect_uri: getRedirectUri(),
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange mislukt');
    }

    const data = await response.json();

    // Sla zowel access_token als refresh_token op
    storeTokens(data.access_token, data.refresh_token, data.expires_in || 14400);
    localStorage.removeItem(VERIFIER_KEY);

    // Clean URL
    const basePath = import.meta.env.BASE_URL || '/';
    window.history.replaceState({}, document.title, basePath);

    return data.access_token;
  } catch (err) {
    console.error('Auth redirect fout:', err);
    localStorage.removeItem(VERIFIER_KEY);
    return null;
  }
}

export function handleSharedToken() {
  const hash = window.location.hash;
  if (hash.includes('shared_token=')) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('shared_token');
    if (token) {
      setStoredToken(token);
      // Sla ook refresh token en client id op zodat gedeelde gebruikers
      // hun sessie kunnen vernieuwen
      const refreshToken = params.get('shared_refresh');
      const clientId = params.get('shared_client');
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      if (clientId) {
        localStorage.setItem(CLIENT_ID_KEY, clientId);
      }
      // Stel een standaard expiry in als we refresh info hebben
      if (refreshToken && clientId) {
        const expiryTime = Date.now() + (14400 - 300) * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      window.history.replaceState({}, document.title, window.location.pathname);
      return token;
    }
  }
  return null;
}

export function generateShareUrl() {
  const token = getStoredAccessToken();
  if (!token) return null;
  const refreshToken = getStoredRefreshToken();
  const clientId = getClientId();
  const params = new URLSearchParams({ shared_token: token });
  if (refreshToken) {
    params.set('shared_refresh', refreshToken);
  }
  if (clientId) {
    params.set('shared_client', clientId);
  }
  return `${window.location.origin}${window.location.pathname}#${params.toString()}`;
}

function getDbx(token) {
  return new Dropbox({ accessToken: token });
}

export async function loadList() {
  const token = await getValidAccessToken();
  const dbx = getDbx(token);

  try {
    const response = await dbx.filesDownload({ path: FILE_PATH });
    const blob = response.result.fileBlob;
    const text = await blob.text();
    return JSON.parse(text);
  } catch (err) {
    // Bestand bestaat nog niet - dat is OK
    if (err?.error?.error?.['.tag'] === 'path' &&
        err.error.error.path?.['.tag'] === 'not_found') {
      return { items: [], lastModified: new Date().toISOString() };
    }
    // Token ongeldig - probeer te vernieuwen
    if (err?.status === 401 ||
        err?.error?.['.tag'] === 'invalid_access_token' ||
        err?.error?.error?.['.tag'] === 'expired_access_token') {
      // Probeer token te vernieuwen en opnieuw
      try {
        const newToken = await refreshAccessToken();
        const dbx2 = getDbx(newToken);
        const response = await dbx2.filesDownload({ path: FILE_PATH });
        const blob = response.result.fileBlob;
        const text = await blob.text();
        return JSON.parse(text);
      } catch {
        const error = new Error('Token verlopen');
        error.code = 'TOKEN_EXPIRED';
        throw error;
      }
    }
    throw err;
  }
}

export async function saveList(data) {
  const token = await getValidAccessToken();
  const dbx = getDbx(token);
  const contents = JSON.stringify(data, null, 2);

  try {
    await dbx.filesUpload({
      path: FILE_PATH,
      contents,
      mode: { '.tag': 'overwrite' },
      mute: true,
    });
  } catch (err) {
    // Token ongeldig - probeer te vernieuwen
    if (err?.status === 401 ||
        err?.error?.['.tag'] === 'invalid_access_token' ||
        err?.error?.error?.['.tag'] === 'expired_access_token') {
      // Probeer token te vernieuwen en opnieuw
      try {
        const newToken = await refreshAccessToken();
        const dbx2 = getDbx(newToken);
        await dbx2.filesUpload({
          path: FILE_PATH,
          contents,
          mode: { '.tag': 'overwrite' },
          mute: true,
        });
        return;
      } catch {
        const error = new Error('Token verlopen');
        error.code = 'TOKEN_EXPIRED';
        throw error;
      }
    }
    throw err;
  }
}
