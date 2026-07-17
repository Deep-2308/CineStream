import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false },
    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    preferences: {
      favoriteGenres:  [{ type: String }],
      favoriteLanguage: { type: String },
      favoriteDecade:   { type: String }, // e.g. '1990s'
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
