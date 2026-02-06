export async function apiFetch(url, options = {}) {
    const token = sessionStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json",
    };

    return fetch(url, {
        ...options,
        headers,
    });
}
