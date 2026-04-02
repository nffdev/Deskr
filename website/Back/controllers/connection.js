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

const receiveScreen = async (req, res) => {
    const { id } = req.params;
    const { frame, monitorIndex, timestamp } = req.body;

    if (!frame) {
        return res.status(400).json({ message: 'Frame data is required' });
    }

    const io = req.app.get('io');
    io.emit('screenFrame', { connectionId: id, frame, monitorIndex: monitorIndex || 0, timestamp: timestamp || Date.now() });

    res.json({ success: true });
};

const getLatestScreen = async (req, res) => {
    res.json({ message: 'Use WebSocket for real-time screen frames' });
};

const connectionMonitors = {};
const pendingCommands = {};

const receiveMonitors = async (req, res) => {
    const { id } = req.params;
    const { monitors } = req.body;

    if (!monitors || !Array.isArray(monitors)) {
        return res.status(400).json({ message: 'monitors array is required' });
    }

    connectionMonitors[id] = monitors;
    const io = req.app.get('io');
    io.emit('monitors', { connectionId: id, monitors });

    res.json({ success: true });
};

const getMonitors = async (req, res) => {
    const { id } = req.params;
    res.json({ monitors: connectionMonitors[id] || [] });
};

const sendCommand = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    if (!pendingCommands[id]) pendingCommands[id] = [];
    pendingCommands[id].push(body);

    if (pendingCommands[id].length > 50) {
        pendingCommands[id] = pendingCommands[id].slice(-50);
    }

    res.json({ success: true });
};

const getCommand = async (req, res) => {
    const { id } = req.params;
    const cmds = pendingCommands[id];
    if (cmds && cmds.length > 0) {
        pendingCommands[id] = [];
        return res.json({ commands: cmds });
    }
    res.json({ commands: [] });
};

module.exports = {
    recordConnection,
    getRecentConnections,
    handleHeartbeat,
    markInactive,
    receiveScreen,
    getLatestScreen,
    receiveMonitors,
    getMonitors,
    sendCommand,
    getCommand
};
