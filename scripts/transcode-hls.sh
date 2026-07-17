#!/usr/bin/env bash
# =============================================================================
# scripts/transcode-hls.sh
# CineStream — HLS transcoding ladder for Originals content pipeline
#
# USAGE:
#   chmod +x scripts/transcode-hls.sh
#   ./scripts/transcode-hls.sh input.mp4 output_dir title_slug
#
# PREREQUISITES:
#   - ffmpeg >= 4.4 with libx264 and aac support
#   - Install: https://ffmpeg.org/download.html
#
# OUTPUT STRUCTURE:
#   output_dir/
#     master.m3u8          ← upload this URL as hlsManifestUrl
#     360p/
#       360p.m3u8
#       *.ts
#     720p/
#       720p.m3u8
#       *.ts
#     1080p/
#       1080p.m3u8
#       *.ts
#
# After transcoding, upload the entire output_dir to R2/Bunny CDN.
# Set hlsManifestUrl = https://<your-cdn>/<title_slug>/master.m3u8
# =============================================================================

set -euo pipefail

INPUT="${1:?Usage: $0 <input.mp4> <output_dir> <title_slug>}"
OUTPUT_DIR="${2:?Usage: $0 <input.mp4> <output_dir> <title_slug>}"
SLUG="${3:?Usage: $0 <input.mp4> <output_dir> <title_slug>}"

SEGMENT_DURATION=6   # seconds per .ts segment
CRF=23               # quality factor: lower = better quality, larger files

echo "==> Transcoding: $INPUT → $OUTPUT_DIR ($SLUG)"
echo "==> Segment duration: ${SEGMENT_DURATION}s | CRF: $CRF"

mkdir -p "$OUTPUT_DIR/360p" "$OUTPUT_DIR/720p" "$OUTPUT_DIR/1080p"

# ---------------------------------------------------------------------------
# 360p — ~400 kbps video
# ---------------------------------------------------------------------------
ffmpeg -i "$INPUT" \
  -vf "scale=-2:360" \
  -c:v libx264 -crf "$CRF" -preset veryfast -profile:v baseline -level 3.0 \
  -c:a aac -b:a 96k -ar 44100 \
  -hls_time "$SEGMENT_DURATION" \
  -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/360p/%04d.ts" \
  "$OUTPUT_DIR/360p/360p.m3u8"

echo "==> 360p done"

# ---------------------------------------------------------------------------
# 720p — ~2 Mbps video
# ---------------------------------------------------------------------------
ffmpeg -i "$INPUT" \
  -vf "scale=-2:720" \
  -c:v libx264 -crf "$CRF" -preset veryfast -profile:v main -level 4.0 \
  -c:a aac -b:a 128k -ar 44100 \
  -hls_time "$SEGMENT_DURATION" \
  -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/720p/%04d.ts" \
  "$OUTPUT_DIR/720p/720p.m3u8"

echo "==> 720p done"

# ---------------------------------------------------------------------------
# 1080p — ~5 Mbps video
# ---------------------------------------------------------------------------
ffmpeg -i "$INPUT" \
  -vf "scale=-2:1080" \
  -c:v libx264 -crf "$CRF" -preset veryfast -profile:v high -level 4.2 \
  -c:a aac -b:a 192k -ar 44100 \
  -hls_time "$SEGMENT_DURATION" \
  -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/1080p/%04d.ts" \
  "$OUTPUT_DIR/1080p/1080p.m3u8"

echo "==> 1080p done"

# ---------------------------------------------------------------------------
# Master playlist — lists all variants for ABR
# ---------------------------------------------------------------------------
cat > "$OUTPUT_DIR/master.m3u8" <<EOF
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=640x360,CODECS="avc1.42E01E,mp4a.40.2"
360p/360p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720,CODECS="avc1.4D401F,mp4a.40.2"
720p/720p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/1080p.m3u8
EOF

echo ""
echo "==> DONE. Upload $OUTPUT_DIR/ to your CDN bucket."
echo "==> Set hlsManifestUrl = https://<your-cdn>/${SLUG}/master.m3u8"
