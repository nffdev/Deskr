const getMe = async (req, res) => {
    return res.status(200).json(req.user);
}

module.exports = {
    getMe
};