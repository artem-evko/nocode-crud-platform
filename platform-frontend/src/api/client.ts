import axios from 'axios';

export const apiClient = axios.create({
    baseURL: 'http://localhost:8082/api',
    withCredentials: true, // Important for session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// We can add interceptors here later to handle generic 401s
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Usually we'd trigger a logout in our store or redirect to login
            console.warn("Unauthorized access detected. Please log in.");
        }
        return Promise.reject(error);
    }
);

export const downloadProjectCode = async (projectId: string) => {
    return apiClient.get(`/projects/${projectId}/download`, {
        responseType: 'blob'
    });
};
