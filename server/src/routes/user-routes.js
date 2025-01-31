const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller'); // Fix the import


router.get('/users/:id/backgrounds', userController.getBackgrounds);

module.exports = router;