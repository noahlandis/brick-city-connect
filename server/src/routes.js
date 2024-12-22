const express = require('express');
const router = express.Router();

router.post('/verify-email', (req, res) => {
    console.log("verify-email route hit");
});

module.exports = router;