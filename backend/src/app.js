const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const errorHandler = require("./middleware/error.middleware");

const app = express();
const defaultOrigins = ["http://localhost:5173", "http://localhost:5174"];
const configuredOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : [];
const allowedOrigins = [...defaultOrigins, ...configuredOrigins, process.env.RENDER_EXTERNAL_URL]
    .map((origin) => origin && origin.trim())
    .filter(Boolean);

// Middleware
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        message: "Welcome to transitOps API 🚛",
        version: "1.0.0",
        status: true,
    });
});

// Routes
const authRoutes = require("./routes/auth.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const settingsRoutes = require("./routes/settings.routes");
const notificationRoutes = require("./routes/notification.routes");

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);

// P2 & P3 routes
const driverRoutes = require("./routes/driver.routes");
const tripRoutes = require("./routes/trip.routes");
const expenseRoutes = require("./routes/expense.routes");
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/expenses", expenseRoutes);

if (process.env.NODE_ENV === "production") {
    const clientDistPath = path.join(__dirname, "../../frontend/dist");

    app.use(express.static(clientDistPath));
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
            return next();
        }

        return res.sendFile(path.join(clientDistPath, "index.html"));
    });
}

// Global error handler (must be after routes)
app.use(errorHandler);

module.exports = app;


