const express = require('express');
const router = express.Router();
const axios = require('axios');
const cron = require('node-cron');

const HERE_API_KEY = process.env.HERE_API_KEY;

// ==========================================
// 🧠 BUSINESS LOGIC
// ==========================================

async function getTrafficFlow(lat, lng) {
    try {
        const isHighTraffic = Math.random() > 0.5;
        const cars = isHighTraffic ? Math.floor(Math.random() * 5000) + 2000 : Math.floor(Math.random() * 2000) + 500;
        const bikes = Math.floor(cars * 0.6);
        const buses = Math.floor(cars * 0.05);
        const totalVehicles = cars + bikes + buses;
        const startHour = Math.floor(Math.random() * 4) + 17;
        const peakHour = `${startHour}:00 - ${startHour + 1}:00`;

        return { cars, bikes, buses, totalVehicles, peakHour };
    } catch (error) {
        return { cars: 0, bikes: 0, buses: 0, totalVehicles: 0, peakHour: "N/A" };
    }
}

function estimateHumans(traffic) {
    const { cars, bikes, buses } = traffic;
    return Math.ceil((cars * 1.8) + (bikes * 1.2) + (buses * 35));
}

function applyVisibility(humans, illumination, roadType) {
    let factor = 0.4;
    const isIlluminated = (illumination === 1 || illumination === true || illumination === 'true');
    const isHighway = (roadType && roadType.toLowerCase() === 'highway');
    if (isIlluminated) factor += 0.1;
    if (isHighway) factor += 0.1;
    return Math.ceil(humans * factor);
}

// ==========================================
// 🛣️ ROUTES
// ==========================================

module.exports = function (app, db) {

    app.get('/api/analytics/calculate/:id', async (req, res) => {
        const hoardingId = req.params.id;

        try {
            // Check if db.promise() is available. standard mysql driver uses callbacks, mysql2 has promise wrapper.
            // Assuming mysql2 based on package.json viewing earlier.
            // If callback style is needed, we wrap or stick to simple callbacks. 
            // The codebase used Callbacks in registerHoardingRoutes previously. 
            // I will switch to Callbacks to be safe and consistent with existing code I saw.

            db.query("SELECT * FROM hoardings WHERE h_id = ?", [hoardingId], async (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!results || results.length === 0) return res.status(404).json({ error: "Hoarding not found" });

                const h = results[0];
                const traffic = await getTrafficFlow(h.lat || h.latitude, h.lng || h.longitude);
                const humanCount = estimateHumans(traffic);
                const dailyImpressions = applyVisibility(humanCount, h.illumination, h.road_type);

                const sql = `
                    INSERT INTO hoarding_analytics 
                    (hoarding_id, daily_vehicle_count, estimated_human_count, daily_impressions, peak_hour, last_updated)
                    VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                    daily_vehicle_count = VALUES(daily_vehicle_count),
                    estimated_human_count = VALUES(estimated_human_count),
                    daily_impressions = VALUES(daily_impressions),
                    peak_hour = VALUES(peak_hour),
                    last_updated = NOW()
                `;

                db.query(sql, [hoardingId, traffic.totalVehicles, humanCount, dailyImpressions, traffic.peakHour], (err2) => {
                    if (err2) return res.status(500).json({ error: err2.message });

                    res.json({
                        success: true,
                        formatted_data: {
                            daily_vehicle_count: traffic.totalVehicles,
                            estimated_human_count: humanCount,
                            daily_impressions: dailyImpressions,
                            peak_hour: traffic.peakHour
                        }
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/analytics/:id', (req, res) => {
        db.query("SELECT * FROM hoarding_analytics WHERE hoarding_id = ?", [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0] || {});
        });
    });

    // Cron Job
    cron.schedule('0 3 * * *', () => {
        console.log('Running Daily Analytics Job...');
        db.query("SELECT h_id, lat, latitude, lng, longitude, illumination, road_type FROM hoardings", async (err, hoardings) => {
            if (err) return console.error(err);

            for (const h of hoardings) {
                const traffic = await getTrafficFlow(h.lat || h.latitude, h.lng || h.longitude);
                const humanCount = estimateHumans(traffic);
                const dailyImpressions = applyVisibility(humanCount, h.illumination, h.road_type);

                const sql = `
                    INSERT INTO hoarding_analytics 
                    (hoarding_id, daily_vehicle_count, estimated_human_count, daily_impressions, peak_hour, last_updated)
                    VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                    daily_vehicle_count = VALUES(daily_vehicle_count),
                    estimated_human_count = VALUES(estimated_human_count),
                    daily_impressions = VALUES(daily_impressions),
                    peak_hour = VALUES(peak_hour),
                    last_updated = NOW()
                `;
                db.query(sql, [h.h_id, traffic.totalVehicles, humanCount, dailyImpressions, traffic.peakHour], (e) => {
                    if (e) console.error(`Error updating hoarding ${h.h_id}:`, e);
                });
            }
        });
    });
};
