module.exports = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.status ? err.message : 'Internal server error.';

    if (!err.status) console.error(err);

    res.status(status).json({ message });
};
