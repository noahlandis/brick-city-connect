const { Background } = require('../models/index');

(async () => {
  try {
    await Background.bulkCreate([
      { name: 'RIT', url: '/rit.jpg', requiredLevel: 5 },
      { name: 'Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', requiredLevel: 2 },
      { name: 'Mountains', url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0', requiredLevel: 5 },
      { name: 'Dining Hall', url: 'https://cdn.rit.edu/images/news/2021-02/dining_ASW2512a.jpg', requiredLevel: 5 },
    ], {
      ignoreDuplicates: true,
    });
    console.log('Backgrounds seeded successfully!');
  } catch (error) {
    console.error('Error seeding backgrounds:', error);
  }
})();