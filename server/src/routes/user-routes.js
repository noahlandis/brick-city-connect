const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller'); // Fix the import
const authMiddleware = require('../middleware/auth');

router.get('/users/:id/backgrounds', authMiddleware, userController.getBackgrounds);

router.get('/users/:id', authMiddleware, userController.getUser);

module.exports = router;