import mongoose from 'mongoose';

const originalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    posterPath: { type: String },
    hlsManifestUrl: { type: String, required: true },
    licenseNote: { type: String },
    durationSeconds: { type: Number },
  },
  { timestamps: true }
);

const Original = mongoose.model('Original', originalSchema);

export default Original;
