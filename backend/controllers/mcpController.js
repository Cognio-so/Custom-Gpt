const McpConfig = require('../models/McpConfig');

// Get all MCP configs for the current user
const getUserMcpConfigs = async (req, res) => {
    try {
        const mcpConfigs = await McpConfig.find({ 
            $or: [
                { createdBy: req.user._id },
                { isPublic: true }
            ]
        });
        
        res.status(200).json({
            success: true,
            mcpConfigs
        });
    } catch (error) {
        console.error('Error fetching user MCP configs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching MCP configurations'
        });
    }
};

// Create a new MCP config
const createMcpConfig = async (req, res) => {
    try {
        const { name, description, schema, isPublic } = req.body;

        // Validate the schema is valid JSON
        try {
            JSON.parse(schema);
        } catch (jsonError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON schema format'
            });
        }

        // Create the MCP config
        const mcpConfig = new McpConfig({
            name,
            description: description || "MCP Configuration",
            schema,
            createdBy: req.user._id,
            isPublic: isPublic === true || isPublic === 'true'
        });

        await mcpConfig.save();

        res.status(201).json({
            success: true,
            message: 'MCP configuration created successfully',
            mcpConfig
        });
    } catch (error) {
        console.error('Error creating MCP config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create MCP configuration',
            error: error.message
        });
    }
};

// Get a specific MCP config
const getMcpConfigById = async (req, res) => {
    try {
        const mcpConfig = await McpConfig.findById(req.params.id);
        
        if (!mcpConfig) {
            return res.status(404).json({
                success: false,
                message: 'MCP configuration not found'
            });
        }

        // Check if user has access (either owner or public config)
        if (mcpConfig.createdBy.toString() !== req.user._id.toString() && !mcpConfig.isPublic) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this MCP configuration'
            });
        }

        res.status(200).json({
            success: true,
            mcpConfig
        });
    } catch (error) {
        console.error('Error fetching MCP config:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching MCP configuration',
            error: error.message
        });
    }
};

// Update an MCP config
const updateMcpConfig = async (req, res) => {
    try {
        let mcpConfig = await McpConfig.findById(req.params.id);

        if (!mcpConfig) {
            return res.status(404).json({
                success: false,
                message: 'MCP configuration not found'
            });
        }

        // Only creator can update
        if (mcpConfig.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this MCP configuration'
            });
        }

        const { name, description, schema, isPublic } = req.body;

        // Validate the schema is valid JSON
        if (schema) {
            try {
                JSON.parse(schema);
            } catch (jsonError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid JSON schema format'
                });
            }
        }

        // Update fields
        mcpConfig.name = name || mcpConfig.name;
        mcpConfig.description = description || mcpConfig.description;
        mcpConfig.schema = schema || mcpConfig.schema;
        mcpConfig.isPublic = isPublic === true || isPublic === 'true';

        await mcpConfig.save();

        res.status(200).json({
            success: true,
            message: 'MCP configuration updated successfully',
            mcpConfig
        });
    } catch (error) {
        console.error('Error updating MCP config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update MCP configuration',
            error: error.message
        });
    }
};

// Delete an MCP config
const deleteMcpConfig = async (req, res) => {
    try {
        const mcpConfig = await McpConfig.findById(req.params.id);

        if (!mcpConfig) {
            return res.status(404).json({
                success: false,
                message: 'MCP configuration not found'
            });
        }

        // Only creator can delete
        if (mcpConfig.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this MCP configuration'
            });
        }

        await mcpConfig.deleteOne();

        res.status(200).json({
            success: true,
            message: 'MCP configuration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting MCP config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete MCP configuration',
            error: error.message
        });
    }
};

module.exports = {
    getUserMcpConfigs,
    createMcpConfig,
    getMcpConfigById,
    updateMcpConfig,
    deleteMcpConfig
};