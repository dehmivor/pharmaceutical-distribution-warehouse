const User = require('../models/User');

const userService = {

    findUsersByEmailLocal: async (localPart) => {
        if (!localPart) return [];
        // build a regex that matches start of string, the localPart, then '@'
        const re = new RegExp(`^${localPart}\\@`, 'i');
        return await User.find({ email: re }).lean();
    }
}

module.exports = userService;