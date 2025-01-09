// frontend/src/api.js
// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://127.0.0.1:8000/api/v1/', // Adjust if your API is hosted elsewhere
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
// });

// export default api;

// src/api/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1/', // Replace with your backend URL
});

// Add a request interceptor
api.interceptors.request.use(
(config) => {
    const token = localStorage.getItem('authToken'); // Replace 'authToken' with your token storage key
    if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
(error) => {
    return Promise.reject(error);
}
);

const handleResponse = async (response) => {
   if (!response) {
        throw new Error('No response received from server');
      }

    if (response.status >= 400) {
      let errorMessage;
      if (response.data && response.data.message) {
        errorMessage = response.data.message;
      }
      else {
        errorMessage = `Server error: ${response.status}`
      }
      
      throw new Error(errorMessage);
    }
    return response.data;

};

const apiWrapper = {
    async get(url, params = {}) {
        try {
            const response = await api.get(url, { params });
             console.log("Response:", response)
            return handleResponse(response);
        }
        catch (error) {
            console.log("Error:", error)
            throw error;
        }
    },
      async searchProducts(params) {
          return this.get('marketplace/search/', params)
      }
};

export  {api,apiWrapper};