import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
	messages: [],
	users: [],
	selectedUser: null,
	isUsersLoading: false,
	isMessagesLoading: false,

	getUsers: async () => {
		set({ isUsersLoading: true });
		try {
			const res = await axiosInstance.get("/messages/users");
			set({ users: res.data });
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling with a fallback message ---
			const errorMessage = error.response?.data?.message || "Failed to load users.";
			toast.error(errorMessage);
		} finally {
			set({ isUsersLoading: false });
		}
	},

	getMessages: async (userId) => {
		set({ isMessagesLoading: true });
		try {
			const res = await axiosInstance.get(`/messages/${userId}`);
			set({ messages: res.data });
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling with a fallback message ---
			const errorMessage = error.response?.data?.message || "Failed to load messages.";
			toast.error(errorMessage);
		} finally {
			set({ isMessagesLoading: false });
		}
	},

	sendMessage: async (messageData) => {
		const { selectedUser, messages } = get();
		if (!selectedUser) return toast.error("No user selected.");

		try {
			const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
			set({ messages: [...messages, res.data] });
		} catch (error) {
			// --- IMPROVEMENT: Safer error handling with a fallback message ---
			const errorMessage = error.response?.data?.message || "Failed to send message.";
			toast.error(errorMessage);
		}
	},

	// --- IMPROVEMENT: Manages the socket listener lifecycle more safely ---
	subscribeToMessages: () => {
		const socket = useAuthStore.getState().socket;

		// --- IMPROVEMENT: Check if socket is connected before subscribing ---
		if (!socket) return;

		// Clean up any previous listener to prevent duplicates
		socket.off("newMessage");

		socket.on("newMessage", (newMessage) => {
			// --- IMPROVEMENT: Use get() to access the latest state inside the listener ---
			const { selectedUser, messages } = get();

			// Only add the message to the state if it's for the currently active chat
			if (selectedUser?._id === newMessage.senderId) {
				set({
					messages: [...messages, newMessage],
				});
			}
			// You could add an 'else' block here to handle notifications for other chats
		});
	},

	// --- IMPROVEMENT: Safely unsubscribes from the message listener ---
	unsubscribeFromMessages: () => {
		const socket = useAuthStore.getState().socket;
		if (socket) {
			// Removes all listeners for the 'newMessage' event from this client
			socket.off("newMessage");
		}
	},

	setSelectedUser: (selectedUser) => {
		set({ selectedUser, messages: [] }); // Also clear previous messages
	},
}));
