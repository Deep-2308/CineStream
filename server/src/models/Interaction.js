import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', index: true }, // Optional for some types like search, but required for most
    type: {
      type: String,
      enum: ['rating', 'watchlist_add', 'watchlist_remove', 'watch_progress', 'search'],
      required: true,
    },
    rating: { type: Number, min: 1, max: 10 },
    progressSeconds: { type: Number },
    searchQuery: { type: String },
  },
  { timestamps: true }
);

// Compound indexes
interactionSchema.index({ user: 1, movie: 1 });
interactionSchema.index({ user: 1, createdAt: -1 });
// Partial unique index: only one rating per user per movie
interactionSchema.index(
  { user: 1, movie: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'rating' } }
);

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;
