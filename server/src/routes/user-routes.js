const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller'); // Fix the import


router.get('/users/:id/backgrounds', userController.getBackgrounds);

router.get('/users/:id', userController.getUser);

module.exports = router;