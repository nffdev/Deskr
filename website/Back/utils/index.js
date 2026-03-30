function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    sleep,
    asyncHandler
};