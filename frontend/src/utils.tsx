import { useEffect } from 'react';

export const BACKEND_URL = 'http://127.0.0.1:2/';

export async function getBackend(url: string, authToken: string = "") {
  try {
    const headers: { [key: string]: string } = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if(authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(BACKEND_URL + url, {
      method: 'GET',
      headers
    });
    const json = response.status !== 204 ? await response.json() : null;
    return { status: response.status, ok: response.ok, body: json };
  } catch(err) {
    if(err instanceof TypeError) {
      return { status: 0, ok: false, body: { message: err.message } };
    } else {
      throw err;
    }
  }
}

export async function postBackend(url: string, body: { [key: string]: any }, authToken: string = "") {
  try {
    const headers: { [key: string]: string } = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if(authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(BACKEND_URL + url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const json = response.status !== 204 ? await response.json() : null;
    return { status: response.status, ok: response.ok, body: json };
  } catch(err) {
    return { status: 0, ok: false, body: { message: (err as Error).message } };
  }
}

export async function useSetPageTitle(title: string) {
  useEffect(() => {
    document.title = title + " - CommuniCare";
  }, []);
}
