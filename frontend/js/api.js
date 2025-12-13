// API Configuration
const getApiBaseUrl = () => {
    // Production: Environment variable'dan al
    if (window.API_BASE_URL) {
        return window.API_BASE_URL;
    }

    // Development: localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001/api';
    }

    // Fallback: Production backend
    return 'https://be.apps.bredimedia.com/api';
};

const API_BASE = getApiBaseUrl();

console.log('API Base URL:', API_BASE);

// API Client
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint);
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    },

    // Statistics endpoints
    statistics: {
        getOverview() {
            return api.get('/statistics/overview');
        }
    },

    // Documents endpoints
    documents: {
        getRecent(limit = 10) {
            return api.get(`/documents/recent?limit=${limit}`);
        },
        upload(formData) {
            return fetch(`${API_BASE}/documents/upload`, {
                method: 'POST',
                body: formData
            }).then(r => r.json());
        }
    },

    // Subjects endpoints
    subjects: {
        getAll() {
            return api.get('/subjects');
        },
        getById(id) {
            return api.get(`/subjects/${id}`);
        },
        create(data) {
            return api.post('/subjects', data);
        },
        update(id, data) {
            return api.put(`/subjects/${id}`, data);
        },
        delete(id) {
            return api.delete(`/subjects/${id}`);
        }
    },

    // Departments endpoints
    departments: {
        getAll() {
            return api.get('/departments');
        },
        getById(id) {
            return api.get(`/departments/${id}`);
        },
        create(data) {
            return api.post('/departments', data);
        },
        update(id, data) {
            return api.put(`/departments/${id}`, data);
        },
        delete(id) {
            return api.delete(`/departments/${id}`);
        }
    },

    // Folders endpoints
    folders: {
        getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return api.get(`/folders${query ? '?' + query : ''}`);
        },
        getById(id) {
            return api.get(`/folders/${id}`);
        },
        create(data) {
            return api.post('/folders', data);
        },
        update(id, data) {
            return api.put(`/folders/${id}`, data);
        },
        delete(id) {
            return api.delete(`/folders/${id}`);
        }
    }
};
