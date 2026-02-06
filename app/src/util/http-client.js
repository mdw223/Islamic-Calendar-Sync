function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export default class HTTPClient {
  static baseURL = process.env.APP_API_URL || '';

  // GET request
  static async get(url) {
    return fetch(this.baseURL + url).then(handleResponse);
  }

  // POST request
  async post(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // PUT request
  async put(url, data) {
    const response = await fetch(HTTPClient.baseURL + url, {
      method: 'PUT',
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
    });
    return handleResponse(response);
  }

  // POST with authentication token
  async postWithAuth(url, data, token) {
    const response = await fetch(HTTPClient.baseURL + url, { // TODO: fix the way authentication works
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  // GET with authentication token
  static async getWithAuth(url, token) {
    const response = await fetch(this.baseURL + url, {  // TODO: fix the way authentication works
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }
}