import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    authProviders: [{ type: String, enum: ['password', 'google'] }],
    onboardingCompleted: { type: Boolean, default: false },
    refreshTokenHash: { type: String, select: false },
    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    preferences: {
      favoriteGenres: [{ type: String }],
      favoriteLanguage: { type: String },
      favoriteDecade: { type: String }, // e.g. '1990s'
      languages: [{ type: String }],
      contentPrefs: {
        eraFrom: { type: Number },
        runtimeMax: { type: Number },
      },
      accentColor: { type: String },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
