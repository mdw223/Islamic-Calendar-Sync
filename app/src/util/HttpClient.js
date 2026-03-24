import { getToken } from "./AuthToken.js";

function handleResponse(response) {
  if (!response.ok) {
    const err = new Error(`HTTP error! status: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export default class HTTPClient {
  static baseURL = '/api'; // OR so it works on page refresh

  // methods are static bec: no instance state/constructor
  
  // GET request (sends Authorization: Bearer when token is stored)
  static async get(url) {
    return fetch(this.baseURL + url, {
      credentials: 'include',
      headers: authHeaders(),
    }).then(handleResponse);
  }

  // POST request
  static async post(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // PUT request
  static async put(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // PATCH request
  static async patch(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'PATCH',
      credentials: 'include',
      headers: authHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // DELETE request (204 No Content has no JSON body)
  static async delete(url) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = new Error(`HTTP error! status: ${response.status}`);
      err.status = response.status;
      throw err;
    }
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  }
}