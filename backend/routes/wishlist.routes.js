module.exports = function registerWishlistRoutes(app, db) {

    // ✅ Get Wishlist by User ID (all 3 types, no duplicates)
    app.get("/wishlist/:userId", (req, res) => {
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
                if (item.itemType === 'screen') {
                    return {
                        wishlist_id: item.wishlist_id,
                        user_id: item.user_id,
                        screen_id: item.screen_id,
                        h_id: item.h_id,
                        s_id: item.s_id,
                        created_at: item.created_at,
                        itemType: 'screen',
                        name: item.screen_name,
                        location: item.screen_location,
                        price: item.screen_price,
                        imageUrl: null
                    };
                } else if (item.itemType === 'hoarding') {
                    return {
                        wishlist_id: item.wishlist_id,
                        user_id: item.user_id,
                        screen_id: item.screen_id,
                        h_id: item.h_id,
                        s_id: item.s_id,
                        created_at: item.created_at,
                        itemType: 'hoarding',
                        name: item.hoarding_name,
                        location: item.hoarding_location,
                        price: item.hoarding_price,
                        imageUrl: null
                    };
                } else if (item.itemType === 'society') {
                    return {
                        wishlist_id: item.wishlist_id,
                        user_id: item.user_id,
                        screen_id: item.screen_id,
                        h_id: item.h_id,
                        s_id: item.s_id,
                        created_at: item.created_at,
                        itemType: 'society',
                        name: item.society_name,
                        location: item.society_location,
                        price: item.society_price,
                        imageUrl: null
                    };
                } else {
                    return item;
                }
            });

            res.json(formatted);
        });
    });

    // ✅ Add to Wishlist
    app.post("/wishlist", (req, res) => {
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
    app.delete("/wishlist/:userId/:itemId", (req, res) => {
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

};
