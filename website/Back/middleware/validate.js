module.exports = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const message = result.error.errors[0].message;
        return res.status(400).json({ message });
    }

    req.body = result.data;
    next();
};
