// src/utils/refreshAccesToken.jsx

let isRefreshing = false;
let refreshSubscribers = [];

async function refreshAccessToken() {
    const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Refresh failed');
    }
    localStorage.setItem('accessToken', data.accessToken);
    // console.log(data.accessToken)
    return data.accessToken;
}

function onTokenRefreshed(newToken) {
    refreshSubscribers.forEach(cb => cb(newToken));
    refreshSubscribers = [];
}

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

export async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('accessToken');
    // Создаём новые заголовки, копируя только необходимые
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);

    const fetchOptions = {
        ...options,
        headers,
        credentials: 'include',
    };

    let response = await fetch(url, fetchOptions);

    if (response.status === 401 || response.status === 403) {
        let newToken;
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                newToken = await refreshAccessToken();
                isRefreshing = false;
                onTokenRefreshed(newToken);
            } catch (err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userId');
                window.location.href = '/login';
                throw err;
            } 
        } else {
                newToken = await new Promise(resolve => subscribeTokenRefresh(resolve))
            }

        // Повторяем запрос с новым токеном
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        const retryOptions = {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
        };
        response = await fetch(url, retryOptions);
    }

    return response;
}