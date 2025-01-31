const { User, Background } = require('../models/index');

const userController = {
    getBackgrounds: async (req, res) => {
        const { id } = req.params;  
        console.log("Getting backgrounds for user", id);
        const user = await User.findByPk(id, { include: Background });
          // we get all the backgrounds
          const allBackgrounds = await Background.findAll(
            {
              order: [['requiredLevel', 'ASC']],
              attributes: ['id', 'name', 'url'] // we exclude createdAt and updatedAt
            }
          );

          // we get the user's unlocked backgrounds
          const userBackgrounds = await user.getBackgrounds();

          // Then we map all the backgrounds and mark them as locked/unlocked.
          // Note that although we know the user's level and the required level for each background,
          // this allows us for flexibility if we gift backgrounds to users.
          const backgrounds = allBackgrounds.map(background => {
              return {
                  ...background.toJSON(), // Convert Sequelize instance to plain object
                  locked: !userBackgrounds.some(userBackground => userBackground.id === background.id),
              };
          });
          return res.status(200).json(backgrounds);
    },
    
    getUser: async (req, res) => {
      const { id } = req.params;  
      console.log("Getting backgrounds for user", id);
      let user = await User.findByPk(id, {include: Background});

        // we get all the backgrounds
        const allBackgrounds = await Background.findAll(
          {
            order: [['requiredLevel', 'ASC']],
            attributes: ['id', 'name', 'url'] // we exclude createdAt and updatedAt
          }
        );

        // we get the user's unlocked backgrounds
        const userBackgrounds = await user.getBackgrounds();

        // Then we map all the backgrounds and mark them as locked/unlocked.
        // Note that although we know the user's level and the required level for each background,
        // this allows us for flexibility if we gift backgrounds to users.
        const backgrounds = allBackgrounds.map(background => {
            return {
                ...background.toJSON(), // Convert Sequelize instance to plain object
                locked: !userBackgrounds.some(userBackground => userBackground.id === background.id),
            };
        });
        user = user.toJSON();
        user.backgrounds = backgrounds;        
        return res.status(200).json(user);
    }
}

module.exports = userController;