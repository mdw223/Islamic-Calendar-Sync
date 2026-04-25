function handleResponse(response) {
  if (!response.ok) {
    const err = new Error(`HTTP error! status: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export default class HTTPClient {
  // Local dev: relative `/api` matches the dev proxy. Production (GitHub Pages): set at build time, e.g. `https://api.example.com/api`.
  static baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

  // methods are static bec: no instance state/constructor

  // GET request (auth cookie sent automatically by the browser via credentials: include)
  static async get(url) {
    return fetch(this.baseURL + url, {
      credentials: 'include',
    }).then(handleResponse);
  }

  // POST request
  static async post(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // PUT request
  static async put(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // PATCH request
  static async patch(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // DELETE request (204 No Content has no JSON body)
  static async delete(url) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'DELETE',
      credentials: 'include',
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
