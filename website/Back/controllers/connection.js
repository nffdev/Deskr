const Connection = require('../models/Connection');

const connection = {
    recordConnection: async (req, res) => {
        try {
            console.log('New connection:', req.body);
            
            const ip = req.body.ip || req.ip || req.connection.remoteAddress;
            const deviceInfo = req.body.deviceInfo || req.headers['user-agent'] || 'Unknown Device';

            let connection = await Connection.findOne({ ip });

            if (connection) {
                connection.deviceInfo = deviceInfo;
                connection.isActive = true;
                connection.lastHeartbeat = new Date();
                await connection.save();
            } else {
                connection = new Connection({
                    ip,
                    deviceInfo
                });
                await connection.save();
            }
            
            req.app.get('io').emit('newConnection', connection);
            res.status(200).json(connection);
        } catch (error) {
            console.error('Error in recordConnection:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getRecentConnections: async (req, res) => {
        try {
            const connections = await Connection.find()
                .sort({ timestamp: -1 })
                .limit(10);

            const updatedConnections = connections.map(conn => {
                const isActive = conn.isConnectionActive();
                return {
                    ...conn.toObject(),
                    isActive
                };
            });

            res.status(200).json(updatedConnections);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    handleHeartbeat: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await Connection.findById(id);

            if (!connection) {
                return res.status(200).json({ message: 'Connection not found, but continuing heartbeat' });
            }

            connection.lastHeartbeat = new Date();
            connection.isActive = true;
            await connection.save();

            req.app.get('io').emit('connectionUpdated', connection);
            res.status(200).json(connection);
        } catch (error) {
            console.error('Heartbeat error:', error);
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
            
            if (!connection) {
                return res.status(200).json({ message: 'Connection not found, but marked as inactive' });
            }

            req.app.get('io').emit('connectionUpdated', connection);
            res.status(200).json(connection);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = connection;
