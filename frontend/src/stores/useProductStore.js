import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
    products: [],
    isLoading: false,

    setProducts: (products) => set({ products }),

    createProduct: async (productData) => {
        set({ isLoading: true });

        try {
            const res = await axios.post("/products", productData);
            set((prevState) => ({
                products: [...prevState.products, res.data],
                isLoading: false
            }));
        } catch (error) {
            toast.error(error.response.data.error);
            set({ isLoading: false });
        }
    },

    fetchAllProducts: async () => {
        set({ isLoading: true });

        try {
            const res = await axios.get("/products");
            set({ products: res.data.products, isLoading: false });
        } catch (error) {
            set({ error: "Failed to fetch products", isLoading: false });
            toast.error(error.response.data.error || "Failed to fetch products");
        }
    },

    fetchProductsByCategory: async (category) => {
        set({ isLoading: true });

        try {
            const res = await axios.get(`/products/category/${category}`);
            set({ products: res.data.products, isLoading: false });
        } catch (error) {
            set({ error: "Failed to fetch products", isLoading: false });
            toast.error(error.response.data.error || "Failed to fetch products");
        }
    },

    fetchFeaturedProducts: async () => {
        set({ isLoading: true });
        try {
            const res = await axios.get("/products/featured");
            set({ products: res.data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            toast.error(error.response.data.error || "Failed to fetch featured products");
        }
    },

    toggleFeaturedProduct: async (productId) => {
        set({ isLoading: true });
        
        try {
            const res = await axios.patch(`/products/${productId}`);

            // This will update the isFeatured prop of the product
            set((prevProducts) => ({
                products: prevProducts.products.map((product) =>
                    product._id === productId
                        ? { ...product, isFeatured: res.data.isFeatured }
                        : product
                ),
                isLoading: false
            }));
        } catch (error) {
            set({ isLoading: false });
            toast.error(error.response.data.error || "Failed to update product");
        }
    },

    deleteProduct: async (productId) => {
        set({ isLoading: true });

        try {
            await axios.delete(`/products/${productId}`);
            set((prevProducts) => ({
                products: prevProducts.products.filter(
                    (product) => product._id !== productId
                ),
                isLoading: false
            }));
        } catch (error) {
            set({ isLoading: false });
            toast.error(error.response.data.error || "Failed to delete product");
        }
    }
}));