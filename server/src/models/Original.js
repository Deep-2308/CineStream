import mongoose from 'mongoose';

const originalSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true },
    description:    { type: String },
    posterPath:     { type: String },
    backdropPath:   { type: String },
    // hlsManifestUrl is the stable natural key for upserts — must be unique & https-only
    hlsManifestUrl: { type: String, required: true, unique: true },
    durationSeconds:{ type: Number },
    releaseYear:    { type: Number },
    genres:         { type: [String], index: true },
    language:       { type: String, default: 'en' },
    licenseNote:    { type: String },
    featured:       { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Original = mongoose.model('Original', originalSchema);

export default Original;
