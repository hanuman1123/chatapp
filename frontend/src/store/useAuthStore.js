import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "https://chatapp-suvi.onrender.com";

// Utility: Simplified error toasts
const toastError = (error, fallback = "Something went wrong") => {
  toast.error(error?.response?.data?.message || fallback);
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.error("❌ checkAuth error:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toastError(error, "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toastError(error, "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toastError(error, "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toastError(error, "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    if (socket && socket.connected) return; // Already connected

    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      newSocket.emit("refreshOnlineUsers");
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    const handleBeforeUnload = () => newSocket.disconnect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        newSocket.disconnect();
      } else if (document.visibilityState === "visible") {
        if (newSocket.disconnected) {
          get().connectSocket();
        } else {
          newSocket.emit("refreshOnlineUsers");
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("visibilitychange", handleVisibilityChange);

    // Optional: keep connection alive on platforms like Render
    const pingInterval = setInterval(() => {
      if (newSocket.connected) newSocket.emit("ping");
    }, 25000);

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", newSocket.id);

      newSocket.off("connect");
      newSocket.off("getOnlineUsers");
      newSocket.off("disconnect");

      clearInterval(pingInterval);

      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
