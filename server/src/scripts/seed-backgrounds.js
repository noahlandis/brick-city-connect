const { Background } = require('../models/index');

(async () => {
  try {
    await Background.bulkCreate([
      { url: 'sau.png', name: 'SAU', requiredLevel: 2 },
      { url: 'shed.png', name: 'Shed', requiredLevel: 3 },
      { url: 'magic.png', name: 'Magic', requiredLevel: 4 },
      { url: 'gene_polisseni.png', name: 'Gene Polisseni', requiredLevel: 5 },
      { url: 'global_village.png', name: 'Global Village', requiredLevel: 6 },
      { url: 'infinity_quad.png', name: 'Infinity Quad', requiredLevel: 7 },
      { url: 'crossroads.png', name: 'Crossroads', requiredLevel: 8 },

      // future backgrounds
      // { url: 'library.png', name: 'Library', requiredLevel: 9 },
      // { url: 'fountain.png', name: 'Fountain', requiredLevel: 10 },
      // { url: 'tiger_statue.png', name: 'Tiger Statue', requiredLevel: 11 },



    ], {
      ignoreDuplicates: true,
    });
    console.log('Backgrounds seeded successfully!');
  } catch (error) {
    console.error('Error seeding backgrounds:', error);
  }
})();