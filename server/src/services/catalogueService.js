import Movie from '../models/Movie.js';

export const catalogueService = {
  getPopular: async ({ page = 1, limit = 20 }) => {
    // Floor page and cap limit
    page = Math.max(1, parseInt(page, 10));
    limit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      Movie.find({})
        .sort({ popularity: -1 })
        .skip(skip)
        .limit(limit)
        .select('-embedding -__v')
        .lean(),
      Movie.countDocuments({})
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      page,
      totalPages,
      totalItems
    };
  },

  getTrending: async ({ limit = 20 }) => {
    limit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const items = await Movie.find({})
      .sort({ popularity: -1 })
      .limit(limit)
      .select('-embedding -__v')
      .lean();

    return {
      items,
      page: 1,
      totalPages: 1,
      totalItems: items.length
    };
  },

  getByGenre: async ({ genre, page = 1, limit = 20 }) => {
    page = Math.max(1, parseInt(page, 10));
    limit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const decodedGenre = decodeURIComponent(genre);
    
    // Case-insensitive regex match for genres
    const query = {
      genres: { $regex: new RegExp(`^${decodedGenre}$`, 'i') }
    };

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      Movie.find(query)
        .sort({ popularity: -1 })
        .skip(skip)
        .limit(limit)
        .select('-embedding -__v')
        .lean(),
      Movie.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      page,
      totalPages,
      totalItems
    };
  },

  getById: async (movieId) => {
    const movie = await Movie.findById(movieId).select('-embedding -__v').lean();
    if (!movie) return null;
    return movie;
  }
};
