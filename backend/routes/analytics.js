const express = require('express');
const router = express.Router();
const axios = require('axios');
const cron = require('node-cron');

require('dotenv').config();
const HERE_API_KEY = process.env.HERE_API_KEY;


// ==========================================
// 🧠 BUSINESS LOGIC
// ==========================================

async function getTrafficFlow(lat, lng) {
    try {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            console.warn("Invalid coordinates:", lat, lng);
            return fallbackTraffic();
        }

        const url = `https://traffic.ls.hereapi.com/traffic/6.3/flow.json`;

        const response = await axios.get(url, {
            params: {
                apiKey: HERE_API_KEY,
                prox: `${lat},${lng},800`, // bigger radius = better detection
                responseattributes: 'sh,fc'
            },
            timeout: 5000
        });

        const flows = response.data?.RWS?.[0]?.RW || [];
        if (!flows.length) return fallbackTraffic();

        let congestionScore = 0;
        let roadCount = 0;

        flows.forEach(rw => {
            rw.FIS?.forEach(fi => {
                fi.FI?.forEach(seg => {
                    const cf = seg.CF?.[0];
                    if (!cf) return;

                    const jamFactor = cf.JF || 0;  // congestion 0–10
                    const speed = cf.SP || 0;      // current speed
                    const freeFlow = cf.FF || 1;   // free flow speed

                    // Weight more if traffic is slow
                    const speedFactor = freeFlow > 0 ? (1 - speed / freeFlow) : 0;

                    congestionScore += (jamFactor + speedFactor * 5);
                    roadCount++;
                });
            });
        });

        const avgCongestion = congestionScore / (roadCount || 1);

        // Convert congestion to vehicle volume
        const baseTraffic = 1800;
        const multiplier = 1 + (avgCongestion / 8);

        const cars = Math.floor(baseTraffic * multiplier);
        const bikes = Math.floor(cars * 0.55);
        const buses = Math.floor(cars * 0.05);
        const totalVehicles = cars + bikes + buses;

        const peakHour = avgCongestion > 6 ? "18:00 - 19:00" : "17:00 - 18:00";

        return { cars, bikes, buses, totalVehicles, peakHour };

    } catch (error) {
        console.error("HERE API failed:", error.message);
        return fallbackTraffic();
    }
}

function fallbackTraffic() {
    return { cars: 500, bikes: 300, buses: 40, totalVehicles: 840, peakHour: "17:00 - 18:00" };
}


function fallbackTraffic() {
    return { cars: 500, bikes: 300, buses: 40, totalVehicles: 840, peakHour: "17:00 - 18:00" };
}



function estimateHumans(traffic) {
    const { cars, bikes, buses } = traffic;
    return Math.ceil((cars * 2) + (bikes * 1.5) + (buses * 45));
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

    // 🔥 CALCULATE ANALYTICS WITH DAILY CACHE
    app.get('/api/analytics/calculate/:id', (req, res) => {
        const hoardingId = req.params.id;

        // STEP 1: Check if already updated today
        db.query(
            "SELECT * FROM hoarding_analytics WHERE hoarding_id = ? AND DATE(last_updated) = CURDATE()",
            [hoardingId],
            async (errCheck, existing) => {
                if (errCheck) return res.status(500).json({ error: errCheck.message });

                if (existing && existing.length) {
                    return res.json({
                        success: true,
                        formatted_data: {
                            daily_vehicle_count: existing[0].daily_vehicle_count,
                            estimated_human_count: existing[0].estimated_human_count,
                            daily_impressions: existing[0].daily_impressions,
                            peak_hour: existing[0].peak_hour
                        }
                    });
                }

                // STEP 2: Fetch hoarding details
                db.query("SELECT * FROM hoardings WHERE h_id = ?", [hoardingId], async (err, results) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (!results.length) return res.status(404).json({ error: "Hoarding not found" });

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
            }
        );
    });

    // GET SAVED ANALYTICS
    app.get('/api/analytics/:id', (req, res) => {
        db.query("SELECT * FROM hoarding_analytics WHERE hoarding_id = ?", [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0] || {});
        });
    });

    // 🌙 CRON AUTO UPDATE DAILY
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