const mongoose = require("mongoose");
const FlightBooking = require("../models/FlightBooking"); // Điều chỉnh đường dẫn nếu cần

mongoose.connect("mongodb+srv://admin1:a67RqW9HDY8Fj4Sh@cluster0.nyw26.mongodb.net/Airport_Weather", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to the database.");
    runMigration();
}).catch((err) => {
    console.error("Database connection error:", err);
});

async function runMigration() {
    try {
        const result = await FlightBooking.updateMany(
            { $or: [{ Initial_price: { $exists: false } }, { Current_price: { $exists: false } }] },
            [{
                $set: {
                    Initial_price: {
                        $cond: { if: { $not: ["$Initial_price"] }, then: 1000000, else: "$Initial_price" }
                    },
                    Current_price: {
                        $cond: { if: { $not: ["$Current_price"] }, then: { $ifNull: ["$Initial_price", 1000000] }, else: "$Current_price" }
                    }
                }
            }]
        );
        console.log(`Migration completed. Modified ${result.modifiedCount} documents.`);
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        mongoose.disconnect();
    }
}
