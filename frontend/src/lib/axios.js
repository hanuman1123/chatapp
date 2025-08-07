import axios from "axios";
const baseURL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api" // your local backend
    : "https://chatapp-suvi.onrender.com/api"; // deployed backend

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// const isLocalhost = window.location.hostname === "localhost";

// const baseURL = isLocalhost
//   ? "http://localhost:5001/api"
//   : "http://192.168.2.62:5001/api";

// export const axiosInstance = axios.create({
//   baseURL,
//   withCredentials: true,
// });
