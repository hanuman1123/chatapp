import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Determine the base URL for the socket connection based on the environment
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

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
			// --- IMPROVEMENT: Pass user data directly to prevent race conditions ---
			get().connectSocket(res.data);
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling ---
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
			// --- IMPROVEMENT: Pass user data directly to prevent race conditions ---
			get().connectSocket(res.data);
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling with a fallback message ---
			const errorMessage = error.response?.data?.message || "An error occurred during sign up.";
			toast.error(errorMessage);
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
			// --- IMPROVEMENT: Pass user data directly to prevent race conditions ---
			get().connectSocket(res.data);
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling with a fallback message ---
			const errorMessage = error.response?.data?.message || "An error occurred during login.";
			toast.error(errorMessage);
		} finally {
			set({ isLoggingIn: false });
		}
	},

	logout: async () => {
		try {
			await axiosInstance.post("/auth/logout");
			set({ authUser: null });
			toast.success("Logged out successfully");
			// --- IMPROVEMENT: Ensure the socket is fully disconnected and cleaned up ---
			get().disconnectSocket();
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling with a fallback message ---
			const errorMessage = error.response?.data?.message || "An error occurred during logout.";
			toast.error(errorMessage);
		}
	},

	updateProfile: async (data) => {
		set({ isUpdatingProfile: true });
		try {
			const res = await axiosInstance.put("/auth/update-profile", data);
			set({ authUser: res.data });
			toast.success("Profile updated successfully");
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling with a fallback message ---
			console.log("error in update profile:", error);
			const errorMessage = error.response?.data?.message || "An error occurred while updating the profile.";
			toast.error(errorMessage);
		} finally {
			set({ isUpdatingProfile: false });
		}
	},

	// --- IMPROVEMENT: Accepts user object directly to avoid state timing issues ---
	connectSocket: (user) => {
		const { socket } = get();
		// Use the passed 'user' object and ensure socket isn't already connected
		if (!user || socket?.connected) return;

		const newSocket = io(BASE_URL, {
			query: {
				userId: user._id,
			},
		});

		newSocket.on("connect", () => {
			console.log("Socket connected:", newSocket.id);
			set({ socket: newSocket });
		});

		newSocket.on("getOnlineUsers", (userIds) => {
			set({ onlineUsers: userIds });
		});
		
		newSocket.on("disconnect", () => {
			console.log("Socket disconnected");
			// Optionally reset state on unexpected disconnect
			set({ socket: null, onlineUsers: [] });
		});
	},

	// --- IMPROVEMENT: Full cleanup on disconnect ---
	disconnectSocket: () => {
		const { socket } = get();
		if (socket?.connected) {
			// Remove all event listeners to prevent memory leaks
			socket.off("getOnlineUsers");
			socket.off("connect");
			socket.off("disconnect");
			socket.disconnect();
		}
		// Reset socket-related state to initial values
		set({ socket: null, onlineUsers: [] });
	},
}));
