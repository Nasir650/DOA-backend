const express = require('express');
const router = express.Router();

// Minimal stub routes to satisfy server wiring
router.get('/health', (req, res) => {
  res.json({ status: 'OK', route: 'votes' });
});

module.exports = router;