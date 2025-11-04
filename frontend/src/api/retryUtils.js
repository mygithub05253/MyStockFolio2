import axiosInstance from './axiosInstance';

export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await requestFn();
            return result;
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            const shouldRetry = 
                error.code === 'ECONNABORTED' ||
                error.code === 'ERR_NETWORK' ||
                (error.response && error.response.status >= 500) ||
                (error.response && error.response.status === 503);
            
            if (!shouldRetry) {
                throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
    }
};

export const createRetryableRequest = (requestFn, maxRetries = 3, delay = 1000) => {
    return () => retryRequest(requestFn, maxRetries, delay);
};

