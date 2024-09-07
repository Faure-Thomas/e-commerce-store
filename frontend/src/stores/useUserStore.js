import { create } from 'zustand';
import axios from '../lib/axios.js';
import { toast } from 'react-hot-toast';

export const useUserStore = create((set) => ({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async ({ name, email, password, confirmPassword }) => {
        set({ loading: true });
        
        if(password !== confirmPassword) {
            set({ loading: false });
            return toast.error("Passwords do not match");
        }

        try {
            const res = await axios.post('/auth/signup', { name, email, password });
            set({ user: res.data.user, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "An error occurred");
        }
    },

    login: async ({ email, password }) => {
        set({ loading: true });

        try {
            const res = await axios.post('/auth/login', { email, password });
            set({ user: res.data.user, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "An error occurred");
        }
    },

    logout: async () => {
        try {
            await axios.post('/auth/logout');
            set({ user: null });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "An error occurred during logout");
        }
    },

    checkAuth: async () => {
        set({ checkingAuth: true });

        try {
            const res = await axios.get('/auth/profile');
            set({ user: res.data, checkingAuth: false });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            set({ checkingAuth: false, user: null });
        }
    },
}));

// TODO: Implement the axios interceptors for refreshing access token