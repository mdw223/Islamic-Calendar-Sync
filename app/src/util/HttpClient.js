function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export default class HTTPClient {
  static baseURL = '/api'; // OR so it works on page refresh

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
}