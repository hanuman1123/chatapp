import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
})

// const isLocalhost = window.location.hostname === "localhost";

// const baseURL = isLocalhost
//   ? "http://localhost:5001/api"
//   : "http://192.168.2.62:5001/api";

// export const axiosInstance = axios.create({
//   baseURL,
//   withCredentials: true,
// });
