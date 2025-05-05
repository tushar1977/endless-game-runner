const express = require('express');
const { fetchPlayerProfile, initPlayer, mintNft } = require('../controllers/player.controller');

const router = express.Router();

router.post('/fetchProfile', fetchPlayerProfile);
router.post('/init', initPlayer);
router.post('/mintNFT', mintNft);

module.exports = router
