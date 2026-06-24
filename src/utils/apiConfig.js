let warnedMissingBaseUrl = false;

export const getBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

    if (!baseUrl && !warnedMissingBaseUrl) {
        console.error('VITE_API_BASE_URL não configurada.');
        warnedMissingBaseUrl = true;
    }

    return baseUrl.replace(/\/+$/, '');
};