const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const McpConfigSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: "MCP Configuration",
        trim: true
    },
    schema: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const McpConfig = mongoose.model('McpConfig', McpConfigSchema);

module.exports = McpConfig;