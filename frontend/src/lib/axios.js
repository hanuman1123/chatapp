import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://chatapp-jagadeesh.vercel.app/api",
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
