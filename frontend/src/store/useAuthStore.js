import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Dynamically resolve server URL
// const hostname = window.location.hostname;
// const BASE_URL =
//   hostname === "localhost"
//     ? "http://localhost:5001"
//     : `http://${hostname}:5001`;

const BASE_URL = "https://chatapp-suvi.onrender.com"

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
      console.log("Error in checkAuth:", error);
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
      toast.error(error.response?.data?.message || "Signup failed");
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
      toast.error(error.response?.data?.message || "Login failed");
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
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    let newSocket = socket;

    if (!socket || socket.disconnected) {
      newSocket = io(BASE_URL, {
        query: { userId: authUser._id },
        withCredentials: true,
      });

      set({ socket: newSocket });

      newSocket.on("connect", () => {
        console.log("🔌 Connected:", newSocket.id);
        newSocket.emit("refreshOnlineUsers"); // Ask backend to send fresh list
      });

      newSocket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
      });

      const handleBeforeUnload = () => {
        newSocket.disconnect();
      };

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

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected:", newSocket.id);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("visibilitychange", handleVisibilityChange);
      });
    } else if (!newSocket.connected) {
      newSocket.connect();
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
