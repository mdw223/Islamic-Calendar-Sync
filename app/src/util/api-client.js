import HTTPClient from './http-client'
// this is like the .data layer interacting with the backend

const API_BASE = process.env.API_BASE_URL;
export default class APIClient {
    static async getCurrentUser() {
        return HTTPClient.get(`${API_BASE}/users/me`);
    }
    // TODO: finish

}