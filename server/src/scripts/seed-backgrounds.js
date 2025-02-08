const { Background } = require('../models/index');

(async () => {
  try {
    await Background.bulkCreate([
      // use the order name, url, requiredLevel instead
      // dont include the id
      { url: 'sau.png', name: 'SAU', requiredLevel: 2 },
      { url: 'fountain.png', name: 'Fountain', requiredLevel: 3 },
      { url: 'shed.png', name: 'Shed', requiredLevel: 4 },
      { url: 'magic.png', name: 'Magic', requiredLevel: 5 },
      { url: 'gene_polisseni.png', name: 'Gene Polisseni', requiredLevel: 6 },
      { url: 'global_village.png', name: 'Global Village', requiredLevel: 7 },
      { url: 'tiger_statue.png', name: 'Tiger Statue', requiredLevel: 8 },
      { url: 'library.png', name: 'Library', requiredLevel: 9 },
      { url: 'infinity_quad.png', name: 'Infinity Quad', requiredLevel: 10 },
      { url: 'crossroads.png', name: 'Crossroads', requiredLevel: 11 },

    ], {
      ignoreDuplicates: true,
    });
    console.log('Backgrounds seeded successfully!');
  } catch (error) {
    console.error('Error seeding backgrounds:', error);
  }
})();