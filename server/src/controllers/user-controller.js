const { Background } = require('../models/index');

const userController = {
    getBackgrounds: async (req, res) => {
        const backgrounds = await Background.findAll({
            attributes: ['url', 'name']
        });
        console.log("Just got the backgrounds");
        return res.status(200).json(backgrounds);
    }
}

module.exports = userController;