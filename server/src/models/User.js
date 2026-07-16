import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false },
    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    preferences: {
      favoriteGenres: [{ type: String }],
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
