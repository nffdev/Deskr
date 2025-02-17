const Connection = require('../models/Connection');

const connection = {
    recordConnection: async (req, res) => {
        try {
            const ip = req.ip || req.connection.remoteAddress;
            const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

            const connection = new Connection({
                ip,
                deviceInfo
            });

            await connection.save();
            
            req.app.get('io').emit('newConnection', connection);

            res.status(200).json(connection);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getRecentConnections: async (req, res) => {
        try {
            const connections = await Connection.find()
                .sort({ timestamp: -1 })
                .limit(10);
            res.status(200).json(connections);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    markInactive: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await Connection.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );
            res.status(200).json(connection);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = connection;
