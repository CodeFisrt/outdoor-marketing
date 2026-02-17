const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const axios = require('axios');
const path = require("path");
const fs = require("fs");
const db = require('../db');

// ✅ Get Wishlist by User ID (all 3 types, no duplicates)
// Path: GET /wishlist/:userId
router.get("/:userId", (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT 
            w.wishlist_id, 
            w.user_id, 
            w.screen_id, 
            w.h_id, 
            w.s_id, 
            w.created_at,
            
            -- Determine item type
            CASE 
                WHEN w.screen_id IS NOT NULL THEN 'screen'
                WHEN w.h_id IS NOT NULL THEN 'hoarding'
                WHEN w.s_id IS NOT NULL THEN 'society'
            END AS itemType,

            -- Names
            s.ScreenName AS screen_name,
            h.h_name AS hoarding_name,
            soc.s_name AS society_name,

            -- Locations
            CONCAT(COALESCE(s.Location, ''), ', ', COALESCE(s.City, '')) AS screen_location,
            CONCAT(COALESCE(h.address, ''), ', ', COALESCE(h.city, '')) AS hoarding_location,
            CONCAT(COALESCE(soc.s_address, ''), ', ', COALESCE(soc.s_city, '')) AS society_location,

            -- Prices
            s.RentalCost AS screen_price,
            h.rental_cost AS hoarding_price,
            soc.actual_cost AS society_price

        FROM wishlist w
        LEFT JOIN outdoormarketingscreens s ON w.screen_id = s.ScreenID
        LEFT JOIN hoardings h ON w.h_id = h.h_id
        LEFT JOIN society_marketing soc ON w.s_id = soc.s_id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send(err);

        // Map results to unified structure
        const formatted = results.map(item => {
            const base = {
                wishlist_id: item.wishlist_id,
                user_id: item.user_id,
                screen_id: item.screen_id,
                h_id: item.h_id,
                s_id: item.s_id,
                created_at: item.created_at,
                itemType: item.itemType,
                imageUrl: null
            };

            if (item.itemType === 'screen') {
                return {
                    ...base,
                    name: item.screen_name,
                    location: item.screen_location,
                    price: item.screen_price
                };
            } else if (item.itemType === 'hoarding') {
                return {
                    ...base,
                    name: item.hoarding_name,
                    location: item.hoarding_location,
                    price: item.hoarding_price
                };
            } else if (item.itemType === 'society') {
                return {
                    ...base,
                    name: item.society_name,
                    location: item.society_location,
                    price: item.society_price
                };
            }
            return base;
        });

        res.json(formatted);
    });
});

// ✅ Add to Wishlist
// Path: POST /wishlist
router.post("/", (req, res) => {
    const { user_id, h_id, s_id, screen_id } = req.body;

    const sql = `
        INSERT INTO wishlist (user_id, h_id, s_id, screen_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [user_id, h_id, s_id, screen_id], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ message: "Already in wishlist" });
            }
            return res.status(500).send(err);
        }

        res.status(201).json({ message: "Added to wishlist" });
    });
});

// ✅ Remove from Wishlist
// Path: DELETE /wishlist/:userId/:itemId
router.delete("/:userId/:itemId", (req, res) => {
    const { userId, itemId } = req.params;

    db.query(
        "DELETE FROM wishlist WHERE user_id = ? AND wishlist_id = ?",
        [userId, itemId],
        (err) => {
            if (err) return res.status(500).send(err);
            res.json({ message: "Removed from wishlist" });
        }
    );
});

// ✅ Share Wishlist Items
// Path: POST /wishlist/share
router.post("/share", (req, res) => {
    const { fromUserId, toUserId, items } = req.body;

    if (!toUserId || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid payload" });
    }

    let errors = [];
    let successCount = 0;

    // Process each item
    const promises = items.map(item => {
        return new Promise((resolve) => {
            const { screen_id, h_id, s_id } = item;

            // Check if already exists for toUserId
            const checkSql = `
                SELECT 1 FROM wishlist 
                WHERE user_id = ? 
                AND (
                    (screen_id IS NOT NULL AND screen_id = ?) OR 
                    (h_id IS NOT NULL AND h_id = ?) OR 
                    (s_id IS NOT NULL AND s_id = ?)
                )
                LIMIT 1
            `;

            db.query(checkSql, [toUserId, screen_id || null, h_id || null, s_id || null], (err, results) => {
                if (err) {
                    errors.push(err);
                    return resolve();
                }

                if (results.length > 0) {
                    // Already exists, skip
                    return resolve();
                }

                // Insert if not exists
                const insertSql = `
                    INSERT INTO wishlist (user_id, screen_id, h_id, s_id)
                    VALUES (?, ?, ?, ?)
                `;
                db.query(insertSql, [toUserId, screen_id || null, h_id || null, s_id || null], (err2) => {
                    if (err2) {
                        errors.push(err2);
                    } else {
                        successCount++;
                    }
                    resolve();
                });
            });
        });
    });

    Promise.all(promises).then(() => {
        if (errors.length > 0 && successCount === 0) {
            return res.status(500).json({ message: "Error sharing items", errors });
        }
        res.json({ message: `Successfully shared ${successCount} items`, successCount });
    });
});

// ✅ Download Wishlist PDF
// Path: POST /wishlist/download-pdf

router.post("/download-pdf", async (req, res) => {

    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({
            message: "No items provided"
        });
    }

    try {

        const doc = new PDFDocument({
            margin: 30,
            size: "A4"
        });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=wishlist.pdf"
        );

        doc.pipe(res);

        // ✅ ADD LOGO HERE
        const logoPath = path.join(__dirname, "../assets/logo.png");

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 30, 15, { width: 120 });
        }

        // Move cursor below logo so title doesn't overlap
        doc.moveDown(2);

        // Title
        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("My Inventory Wishlist", {
                align: "center"
            });

        doc.moveDown(1.5);

        // Layout constants
        const cardHeight = 120;
        const cardWidth = 535;
        const imageWidth = 200;
        const imageHeight = 100;
        const padding = 10;

        const fallbackPath = path.join(
            __dirname,
            "../assets/fallback.png"
        );

        let currentY = doc.y;

        for (const item of items) {

            // Page break
            if (currentY + cardHeight > 770) {
                doc.addPage();
                currentY = 30;
            }

            const cardX = 30;
            const cardY = currentY;

            // Draw border
            doc
                .rect(
                    cardX,
                    cardY,
                    cardWidth,
                    cardHeight
                )
                .stroke();

            // IMAGE LEFT
            let imageBuffer = null;

            try {

                if (item.imageUrl) {

                    const response =
                        await axios.get(
                            item.imageUrl,
                            {
                                responseType:
                                    "arraybuffer",
                                timeout: 5000
                            }
                        );

                    imageBuffer =
                        response.data;

                } else if (
                    fs.existsSync(
                        fallbackPath
                    )
                ) {

                    imageBuffer =
                        fallbackPath;

                }

            } catch {

                if (
                    fs.existsSync(
                        fallbackPath
                    )
                ) {
                    imageBuffer =
                        fallbackPath;
                }
            }

            if (imageBuffer) {

                doc.image(
                    imageBuffer,
                    cardX + padding,
                    cardY + padding,
                    {
                        width: imageWidth,
                        height:
                            imageHeight
                    }
                );

            }

            // TEXT RIGHT SIDE
            const textX =
                cardX +
                imageWidth +
                padding +
                10;

            let textY =
                cardY +
                padding;

            const typeLabel =
                item.itemType ===
                    "screen"
                    ? "Digital Screen"
                    : item.itemType ===
                        "hoarding"
                        ? "Hoarding"
                        : "Society Marketing";

            doc
                .fontSize(14)
                .font(
                    "Helvetica-Bold"
                )
                .text(
                    item.name || "N/A",
                    textX,
                    textY
                );

            textY += 22;

            doc
                .fontSize(11)
                .font("Helvetica")
                .text(
                    "Location: " +
                    (item.location ||
                        "N/A"),
                    textX,
                    textY,
                    {
                        width: 280
                    }
                );

            textY += 20;

            doc.text(
                "Price: ₹" +
                Number(
                    item.price || 0
                ).toLocaleString(),
                textX,
                textY
            );

            textY += 20;

            doc.text(
                "Type: " +
                typeLabel,
                textX,
                textY
            );

            // Move to next card position
            currentY +=
                cardHeight + 15;
        }

        doc.end();

    } catch (error) {

        console.error(
            "PDF Error:",
            error
        );

        if (!res.headersSent) {

            res.status(500).json({
                message:
                    "Error generating PDF"
            });

        }

    }

});


module.exports = router;
