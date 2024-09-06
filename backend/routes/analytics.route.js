import express from "express";
import { adminRoute, protectRoute } from "../middlewares/auth.middleware.js";
import { getAnalyticsData, getDailySalesData } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, async (req, res) => {
    try {
        const analyticsData = await getAnalyticsData();

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const dailySalesData = await getDailySalesData(startDate, endDate);

        res.json({ analyticsData, dailySalesData });
    } catch (error) {
        console.log("Error in getAnalytics controller: ", error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;