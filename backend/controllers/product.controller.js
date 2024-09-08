import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}); // Find all products
        res.json({ products });
    } catch (error) {
        console.log("Error in getAllProducts controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        // Check if the featured products are already cached in Redis
        let featuredProducts = await redis.get("featured_products");
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        // If not cached, get the featured products from the database
        featuredProducts = await Product.find({ isFeatured: true }).lean(); // .lean() to get plain JS objects instead of MongoDB documents which is good for performance
        
        if(!featuredProducts) {
            return res.status(404).json({ message: "No featured products found" });
        }

        // Cache the featured products in Redis
        await redis.set("featured_products", JSON.stringify(featuredProducts));

        res.json(featuredProducts);
    } catch (error) {
        console.log("Error in getFeaturedProducts controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const products = await Product.find({ category });
        res.json(products);
    } catch (error) {
        console.log("Error in getProductsByCategory controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            { 
                $sample: { size: 3 } 
            },
            { 
                $project: { 
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                } 
            }
        ]);

        res.json(products);
    } catch (error) {
        console.log("Error in getRecommendedProducts controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

        let cloudinaryResponse = null;

        if(image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category
        });

        res.status(201).json(product);
    } catch (error) {
        console.log("Error in createProduct controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

const updateFeaturedProductsCache = async () => {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error in updateFeaturedProductsCache: ", error.message);
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();

            // Update cache in Redis
            await updateFeaturedProductsCache();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.log("Error in toggleFeaturedProduct controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if(!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Delete the image from Cloudinary
        if(product.image) {
            const publicId = product.image.split("/").pop().split(".")[0]; // This will get the id of the image
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Image deleted from cloudinary");
            } catch (error) {
                console.log("Error in cloudinary delete: ", error.message);
            }
        }

        // Delete the product from the database
        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.log("Error in deleteProduct controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};