const express = require('express');
const router = express.Router();
const { 
    getUserMcpConfigs,
    createMcpConfig,
    getMcpConfigById,
    updateMcpConfig,
    deleteMcpConfig
} = require('../controllers/mcpController');
const { protectRoute } = require('../middleware/authMiddleware');

// All routes need authentication
router.use(protectRoute);

// Get all MCP configs for current user
router.get('/', getUserMcpConfigs);

// Create a new MCP config
router.post('/', createMcpConfig);

// Get, update, delete specific MCP config
router.get('/:id', getMcpConfigById);
router.put('/:id', updateMcpConfig);
router.delete('/:id', deleteMcpConfig);

module.exports = router;