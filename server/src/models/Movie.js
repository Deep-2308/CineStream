import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    overview: { type: String },
    genres: { type: [String], index: true }, // Multikey index on array
    releaseDate: { type: Date },
    runtime: { type: Number },
    posterPath: { type: String },
    backdropPath: { type: String },
    trailerKey: { type: String },
    voteAverage: { type: Number },
    popularity: { type: Number },
    embedding: { type: [Number], select: false },
    ratingCount: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    moodTags: { type: [String], index: true },
  },
  { timestamps: true }
);

// Explicit index declarations
movieSchema.index({ title: 'text', overview: 'text' });
movieSchema.index({ popularity: -1 });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
