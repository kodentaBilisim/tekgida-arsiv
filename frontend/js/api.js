// API Base URL - Direct backend connection
const API_BASE = 'https://be.apps.bredimedia.com/api';

// API Client
const api = {
    // Generic fetch wrapper
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API hatası');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Statistics
    statistics: {
        getOverview: () => api.request('/statistics/overview'),
        getEmptyFolders: () => api.request('/statistics/empty-folders'),
        getUploadsByDate: (startDate, endDate) =>
            api.request(`/statistics/uploads-by-date?startDate=${startDate}&endDate=${endDate}`),
        getDocumentsBySubject: (includeSubSubjects = true) =>
            api.request(`/statistics/documents-by-subject?includeSubSubjects=${includeSubSubjects}`)
    },

    // Departments
    departments: {
        getAll: () => api.request('/departments'),
        getById: (id) => api.request(`/departments/${id}`),
        create: (data) => api.request('/departments', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => api.request(`/departments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => api.request(`/departments/${id}`, {
            method: 'DELETE'
        })
    },

    // Subjects
    subjects: {
        getAll: (parentId = null) => {
            const query = parentId !== null ? `?parentId=${parentId}` : '';
            return api.request(`/subjects${query}`);
        },
        getById: (id) => api.request(`/subjects/${id}`),
        create: (data) => api.request('/subjects', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => api.request(`/subjects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => api.request(`/subjects/${id}`, {
            method: 'DELETE'
        })
    },

    // Folders
    folders: {
        getAll: (filters = {}) => {
            const query = new URLSearchParams(filters).toString();
            return api.request(`/folders${query ? '?' + query : ''}`);
        },
        getById: (id) => api.request(`/folders/${id}`),
        create: (data) => api.request('/folders', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => api.request(`/folders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => api.request(`/folders/${id}`, {
            method: 'DELETE'
        })
    },

    // Documents
    documents: {
        getByFolder: (folderId) => api.request(`/folders/${folderId}/documents`),
        upload: async (folderId, files) => {
            const formData = new FormData();
            for (let file of files) {
                formData.append('documents', file);
            }

            const response = await fetch(`${API_BASE}/documents/upload/${folderId}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Yükleme hatası');
            }

            return await response.json();
        },
        download: (id) => `${API_BASE}/documents/${id}/download`,
        delete: (id) => api.request(`/documents/${id}`, {
            method: 'DELETE'
        })
    },

    // Metadata
    metadata: {
        get: (documentId) => api.request(`/documents/${documentId}/metadata`),
        set: (documentId, key, value) => api.request(`/documents/${documentId}/metadata`, {
            method: 'POST',
            body: JSON.stringify({ key, value })
        }),
        setBulk: (documentId, metadata) => api.request(`/documents/${documentId}/metadata/bulk`, {
            method: 'POST',
            body: JSON.stringify({ metadata })
        }),
        delete: (documentId, key) => api.request(`/documents/${documentId}/metadata/${key}`, {
            method: 'DELETE'
        })
    }
};

// Utility Functions
const utils = {
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Show toast notification
    showToast(message, type = 'success') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } z-50 transition-opacity`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Show loading
    showLoading(element) {
        element.innerHTML = '<p class="text-center text-gray-500 py-8">Yükleniyor...</p>';
    },

    // Show error
    showError(element, message) {
        element.innerHTML = `<p class="text-center text-red-600 py-8">${message}</p>`;
    }
};
