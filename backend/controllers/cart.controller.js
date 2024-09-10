import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
    try {
        const productsIds = req.user.cartItems.map((item) => item.product);
        const products = await Product.find({ _id: { $in: productsIds } });

        // Add quantity to each product
        const cartItems = products.map((product) => {
            const item = req.user.cartItems.find((cartItem) => cartItem.product.toString() === product._id.toString());
            
            return {
                ...product.toJSON(),
                quantity: item.quantity
            };
        });

        res.json(cartItems);
    } catch (error) {
        console.log("Error in getCartProducts controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        const exisitingItem = user.cartItems.find((item) => item.product.toString() === productId);
        
        if(exisitingItem) {
            exisitingItem.quantity += 1;
        } else {
            user.cartItems.push({ product: productId });
        }

        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in addToCart controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if(!productId) {
            user.cartItems = [];
        } else {
            user.cartItems = user.cartItems.filter(item => item.product.toString() !== productId.toString());
        }

        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in removeAllFromCart controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const { id:productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;
        const exisitingItem = user.cartItems.find(item => item.product.toString() === productId.toString());

        if(exisitingItem) {
            if(quantity === 0) {
                user.cartItems = user.cartItems.filter(item => item.id.toString() !== productId.toString());

                await user.save();
                return res.json(user.cartItems);
            }

            exisitingItem.quantity = quantity;

            await user.save();
            res.json(user.cartItems);
        } else {
            res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (error) {
        console.log("Error in updateQuantity controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
};