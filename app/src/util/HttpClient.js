function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export default class HTTPClient {
  // Vite exposes env variables via import.meta.env (VITE_APP_API_URL).
  // When empty (e.g. unset in Docker or dev), use '/api' so requests hit the API behind Nginx, not the SPA.
  static baseURL = import.meta.env.VITE_APP_API_URL || '/api'; // OR so it works on page refresh

  // GET request (credentials: include so session cookies are sent)
  static async get(url) {
    return fetch(this.baseURL + url, { credentials: 'include' }).then(handleResponse);
  }

  // POST request (credentials: include so session cookies are sent)
  static async post(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // PUT request
  async put(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // PATCH request
  async patch(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // DELETE request
  async delete(url) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  }

  // // POST with authentication token
  // async postWithAuth(url, data, token) {
  //   const response = await fetch(HTTPClient.baseURL + url, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${token}`,
  //     },
  //     body: JSON.stringify(data),
  //   });
  //   return handleResponse(response);
  // }

  // // GET with authentication token
  // static async getWithAuth(url, token) {
  //   const response = await fetch(this.baseURL + url, { 
  //     headers: {
  //       'Authorization': `Bearer ${token}`,
  //     },
  //   });
  //   return handleResponse(response);
  // }
}