const { z } = require('zod');

const registerSchema = z.object({
    username: z.string({ required_error: 'Username is required.' })
        .regex(/^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/, 'Username must start with a letter, be 3-16 characters, and contain only letters, numbers, underscores or dashes.'),
    email: z.string({ required_error: 'Email is required.' })
        .email('The provided email is invalid.'),
    password: z.string({ required_error: 'Password is required.' })
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'The password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number and one special character.'
        ),
    confirmPassword: z.string({ required_error: 'You must confirm your password.' })
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords are not matching.',
    path: ['confirmPassword']
});

const loginSchema = z.object({
    email: z.string({ required_error: 'Email is required.' })
        .email('The provided email is invalid.'),
    password: z.string({ required_error: 'Password is required.' })
        .min(1, 'Password is required.')
});

module.exports = {
    registerSchema,
    loginSchema
};
