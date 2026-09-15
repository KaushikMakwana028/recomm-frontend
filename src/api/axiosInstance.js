import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://admin.recomm.in/api/user',
    headers: {
        'Content-Type': 'application/json'
    },
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach customer live location coordinates if available in storage
    try {
        const rawLoc = localStorage.getItem('customer_live_location');
        if (rawLoc) {
            const parsed = JSON.parse(rawLoc);
            if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
                config.params = config.params || {};
                if (config.params.latitude === undefined && config.params.lat === undefined) {
                    config.params.latitude = parsed.latitude;
                }
                if (config.params.longitude === undefined && config.params.lon === undefined && config.params.lng === undefined) {
                    config.params.longitude = parsed.longitude;
                }
            }
        }
    } catch (e) {
        // ignore
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;