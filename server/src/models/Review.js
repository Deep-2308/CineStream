import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    text: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 10 },
  },
  { timestamps: true }
);

// Unique compound index: one review per user per movie
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
