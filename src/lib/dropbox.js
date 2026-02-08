import { Dropbox } from 'dropbox';

const CLIENT_ID = ''; // User must set their own Dropbox App Key

// Redirect URI moet EXACT overeenkomen met wat in Dropbox App Console staat
// Voor GitHub Pages: https://username.github.io/boodschappen-app/
function getRedirectUri() {
  // Origin + base path (zonder trailing slash voor Dropbox)
  const base = import.meta.env.BASE_URL || '/';
  const origin = window.location.origin;
  // Verwijder trailing slash
  return origin + base;
}

export function getRedirectUri_ForDisplay() {
  return getRedirectUri();
}
const FILE_PATH = '/lijst.json';
const TOKEN_KEY = 'dbx_access_token';
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

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

export function setClientId(id) {
  localStorage.setItem(CLIENT_ID_KEY, id);
}

export function getStoredClientId() {
  return localStorage.getItem(CLIENT_ID_KEY) || '';
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
    token_access_type: 'offline',
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
    setStoredToken(data.access_token);
    localStorage.removeItem(VERIFIER_KEY);

    // Clean URL - gebruik base path
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
      window.history.replaceState({}, document.title, window.location.pathname);
      return token;
    }
  }
  return null;
}

export function generateShareUrl() {
  const token = getStoredToken();
  if (!token) return null;
  return `${window.location.origin}${window.location.pathname}#shared_token=${token}`;
}

function getDbx(token) {
  return new Dropbox({ accessToken: token });
}

export async function loadList(token) {
  const dbx = getDbx(token);
  try {
    const response = await dbx.filesDownload({ path: FILE_PATH });
    const blob = response.result.fileBlob;
    const text = await blob.text();
    return JSON.parse(text);
  } catch (err) {
    if (err?.error?.error?.['.tag'] === 'path' &&
        err.error.error.path?.['.tag'] === 'not_found') {
      return { items: [], lastModified: new Date().toISOString() };
    }
    throw err;
  }
}

export async function saveList(token, data) {
  const dbx = getDbx(token);
  const contents = JSON.stringify(data, null, 2);
  await dbx.filesUpload({
    path: FILE_PATH,
    contents,
    mode: { '.tag': 'overwrite' },
    mute: true,
  });
}
