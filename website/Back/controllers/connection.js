const Connection = require('../models/Connection');

const recordConnection = async (req, res) => {
    const ip = req.body.ip || req.ip || req.connection.remoteAddress;
    const deviceInfo = req.body.deviceInfo || req.headers['user-agent'] || 'Unknown Device';

    let connection = await Connection.findOne({ ip });

    if (connection) {
        connection.deviceInfo = deviceInfo;
        connection.isActive = true;
        connection.lastHeartbeat = new Date();
        await connection.save();
    } else {
        connection = new Connection({ ip, deviceInfo });
        await connection.save();
    }

    req.app.get('io').emit('newConnection', connection);
    res.json(connection);
};

const getRecentConnections = async (req, res) => {
    const connections = await Connection.find()
        .sort({ timestamp: -1 })
        .limit(10);

    const updatedConnections = connections.map(conn => ({
        ...conn.toObject(),
        isActive: conn.isConnectionActive()
    }));

    res.json(updatedConnections);
};

const handleHeartbeat = async (req, res) => {
    const { id } = req.params;
    const connection = await Connection.findById(id);

    if (!connection) {
        return res.status(200).json({ message: 'Connection not found, but continuing heartbeat' });
    }

    connection.lastHeartbeat = new Date();
    connection.isActive = true;
    await connection.save();

    req.app.get('io').emit('connectionUpdated', connection);
    res.json(connection);
};

const markInactive = async (req, res) => {
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
    res.json(connection);
};

module.exports = {
    recordConnection,
    getRecentConnections,
    handleHeartbeat,
    markInactive
};
