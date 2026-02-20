const express = require("express");
const router = express.Router();
const biddingController = require("../controllers/bidding.controller");

router.get("/:product_type/:product_id", biddingController.getBidsByProduct);
router.post("/place", biddingController.placeBid);

module.exports = router;
