const express = require("express");
const router = express.Router();

const ControlController = require("../controllers/Control");

router.get("/", ControlController.index);
router.post("/show", ControlController.show);
router.post("/delete", ControlController.destroy);
module.exports = router;
