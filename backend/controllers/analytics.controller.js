import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

export const getAnalyticsData = async () => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null, // It groups all documents together
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        }
    ]);

    const { totalSales, totalRevenue } =  salesData[0] || { totalSales: 0, totalRevenue: 0 };

    return {
        users: totalUsers,
        products: totalProducts,
        totalSales: totalSales,
        totalRevenue: totalRevenue
    }
};

const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};

export const getDailySalesData = async (startDate, endDate) => {
    try {
        const dailySalesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { 
                        $gte: startDate, 
                        $lt: endDate 
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
    
        // Example output:
        // [
        //     { _id: '2021-07-01', sales: 2, revenue: 100 },
        //     { _id: '2021-07-02', sales: 3, revenue: 150 },
        //     { _id: '2021-07-03', sales: 1, revenue: 50 },
        //     { _id: '2021-07-04', sales: 0, revenue: 0 },
        //     { _id: '2021-07-05', sales: 2, revenue: 100 },
        //     { _id: '2021-07-06', sales: 1, revenue: 50 },
        //     { _id: '2021-07-07', sales: 0, revenue: 0 }
        // ]
    
        const dateArray = getDatesInRange(startDate, endDate);
    
        return dateArray.map(date => {
            const foundData = dailySalesData.find(item => item._id === date);
    
            return {
                date: date,
                sales: foundData ? foundData.sales : 0,
                revenue: foundData ? foundData.revenue : 0
            };
        });
    } catch (error) {
        throw error;
    }
};