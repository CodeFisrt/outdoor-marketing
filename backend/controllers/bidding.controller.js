const db = require("../db");

exports.getBidsByProduct = (req, res) => {
    const { product_type, product_id } = req.params;

    const query = `
    SELECT b.*, u.userName 
    FROM bids b
    JOIN users u ON b.user_id = u.userId
    WHERE b.product_type = ? AND b.product_id = ?
    ORDER BY b.amount DESC
  `;

    db.query(query, [product_type, product_id], (err, results) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.status(500).json({ message: "Database error", error: err.message });
        }
        res.json(results);
    });
};

exports.placeBid = (req, res) => {
    const { product_type, product_id, user_id, amount } = req.body;
    const io = req.app.get("io");

    // 1. Validate product exists
    let checkProductQuery = "";
    if (product_type === "hoarding") {
        checkProductQuery = "SELECT * FROM hoardings WHERE h_id = ?";
    } else if (product_type === "society") {
        checkProductQuery = "SELECT * FROM society_marketing WHERE s_id = ?";
    } else if (product_type === "screen") {
        checkProductQuery = "SELECT * FROM outdoormarketingscreens WHERE ScreenID = ?";
    } else {
        return res.status(400).json({ message: "Invalid product type" });
    }

    db.query(checkProductQuery, [product_id], (err, productResults) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (productResults.length === 0) return res.status(404).json({ message: "Product not found" });

        // 2. Check current highest bid
        const highestBidQuery = "SELECT MAX(amount) as maxAmount FROM bids WHERE product_type = ? AND product_id = ?";
        db.query(highestBidQuery, [product_type, product_id], (err, bidResults) => {
            if (err) return res.status(500).json({ message: "Database error", error: err.message });

            const currentMax = bidResults[0].maxAmount || 0;
            const minNextBid = currentMax + 100;

            if (amount < minNextBid) {
                return res.status(400).json({
                    message: `Bid must be at least ${minNextBid}. Current highest is ${currentMax}.`
                });
            }

            // 3. Insert new bid
            const insertQuery = "INSERT INTO bids (product_type, product_id, user_id, amount) VALUES (?, ?, ?, ?)";
            db.query(insertQuery, [product_type, product_id, user_id, amount], (err, result) => {
                if (err) return res.status(500).json({ message: "Database error", error: err.message });

                const newBid = {
                    bid_id: result.insertId,
                    product_type,
                    product_id,
                    user_id,
                    amount,
                    created_at: new Date()
                };

                // Emit newBid event to the product room
                if (io) {
                    io.to(`product_${product_type}_${product_id}`).emit("newBid", newBid);
                }

                res.status(201).json({ message: "Bid placed successfully", bid: newBid });
            });
        });
    });
};
