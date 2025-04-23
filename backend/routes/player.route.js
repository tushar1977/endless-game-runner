const express = require('express');
const { fetchPlayerProfile, initPlayer } = require('../controllers/player.controller');

const router = express.Router();

router.post('/fetchProfile', fetchPlayerProfile);
router.post('/init', initPlayer);

module.exports = router
