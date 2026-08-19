import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MdCameraAlt, MdPhotoLibrary, MdDownload, MdRefresh, MdClose } from 'react-icons/md';
import './PhotoTryOn.css';

/**
 * 2D photo virtual try-on.
 *
 * Overlays a transparent frame image onto a still photo of the shopper — taken
 * with the camera or picked from the gallery — using MediaPipe FaceLandmarker
 * (IMAGE mode) for automatic placement. Everything is composited on a plain 2D
 * <canvas> (no three.js/WebGL), which is lighter and far more reliable on cheap
 * phones than the live-AR path, and needs no camera permission in gallery mode.
 *
 * Placement is fully automatic: the frame is scaled by the pupillary distance,
 * rotated to the eye line, and centred on the eyes. The tuning constants below
 * are the only knobs — adjust after seeing real frames on real faces.
 */

// MediaPipe assets. WASM is pinned to the installed @mediapipe/tasks-vision
// version (never `@latest`, which can drift out of sync with the npm package).
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Frame width as a multiple of the measured pupillary distance. This is applied
// to the *tight* frame bounding box (white margins removed), so it maps the real
// glasses width — not the padded photo — onto the face. Real frames overhang
// the eye area to roughly the face edges, and pure 2×PD measured slightly
// narrow against reference photos of the same frame worn for real.
const FRAME_WIDTH_TO_PD = 2.1;
// Pixels at/above this min-channel brightness are treated as white background
// and made transparent; a short feather band below it softens the cut edge.
const WHITE_CUTOFF = 232;
const WHITE_FEATHER = 16;
// Nudge the frame vertically from the eye line, in multiples of the PD
// (positive = down). Placement anchors the frame's LENS LINE to the pupils
// (see prepareFrame's lensFrac); worn glasses actually sit with the pupils
// slightly ABOVE the lens centre, so a small downward bias matches reality.
const FRAME_VERTICAL_OFFSET_TO_PD = 0.025;

// --- Realism pass (enhanceFrame) tuning ---
// Opaque pixels are classified by their depth from the nearest transparent
// pixel: within RIM_GUARD (fraction of frame width) they are rim/temple and
// stay fully opaque; beyond LENS_CORE they are lens glass. In between, the
// effects blend in smoothly.
const RIM_GUARD_FRAC = 0.02;
const LENS_CORE_FRAC = 0.05;
// Lens rendering follows the product spec's opacity bands — clear 5–15%,
// light tint 25–40%, brown 35–55%, dark 50–70%, polarized 55–75% — via a
// continuous curve on the measured tint luminance L (0–255):
//   bodyAlpha = clamp(LENS_ALPHA_MAX − LENS_ALPHA_SLOPE·L/255, MIN, MAX)
// The lens is drawn in TWO layers: a multiply-blend tint (real glass filters
// the light coming through, keeping the color rich) plus the lens body at
// this alpha. The combination lands each tint family in its spec band while
// eyes stay naturally visible — verified by the harness's measured
// transmission per swatch.
const LENS_ALPHA_MAX = 0.68;
const LENS_ALPHA_SLOPE = 0.58;
const LENS_ALPHA_MIN = 0.12;
// Strength of the multiply tint layer (scaled by the same glass mask).
const TINT_FILTER_STRENGTH = 0.4;
// Deep-interior area must exceed this fraction of the frame box to count as a
// tinted lens at all — thick acetate rims alone don't qualify, and cutouts
// whose (clear) lenses were keyed transparent skip the pass entirely.
const LENS_MIN_AREA_FRAC = 0.06;
// Contact-shadow strength and its downward offset as a fraction of frame height.
const SHADOW_ALPHA = 0.2;
const SHADOW_OFFSET_FRAC = 0.045;

// MediaPipe iris landmark indices (478-point model); fall back to the outer eye
// corners if iris points are unavailable.
const IRIS_LEFT = 468;
const IRIS_RIGHT = 473;
const EYE_CORNER_LEFT = 33;
const EYE_CORNER_RIGHT = 263;

/** Reject `promise` if it doesn't settle within `ms` (guards a stalled CDN). */
function withTimeout(promise, ms, message) {
    let timer;
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(message)), ms);
        }),
    ]);
}

let filesetPromise = null;
/** Resolve the WASM fileset once and share it across GPU/CPU attempts. */
function getFileset() {
    if (!filesetPromise) {
        filesetPromise = FilesetResolver.forVisionTasks(WASM_URL).catch((err) => {
            filesetPromise = null; // allow a later retry to re-download
            throw err;
        });
    }
    return filesetPromise;
}

async function createLandmarker(delegate) {
    // Reuse the cached fileset so a GPU→CPU fallback doesn't re-download the WASM.
    const fileset = await getFileset();
    return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'IMAGE',
        numFaces: 1,
    });
}

let landmarkerPromise = null;
/** Lazily create a single shared IMAGE-mode FaceLandmarker (GPU, then CPU). */
function getLandmarker() {
    if (!landmarkerPromise) {
        // The GPU delegate fails to initialise on some devices/drivers; fall
        // back to CPU rather than looping on the same GPU failure.
        landmarkerPromise = createLandmarker('GPU')
            .catch(() => createLandmarker('CPU'))
            .catch((err) => {
                // Reset so a later attempt can retry from scratch instead of
                // reusing a permanently-rejected promise.
                landmarkerPromise = null;
                throw err;
            });
    }
    return landmarkerPromise;
}

/**
 * Turn a frame image on a white/near-white background into a transparent cutout
 * and measure the tight bounding box of the actual frame. Catalog photos are
 * usually a dark frame on white, so keying out white leaves just the glasses.
 * Returns the processed canvas plus the frame's bounding box (for scaling), or
 * null if the image is cross-origin without CORS (pixels can't be read).
 */
function prepareFrame(frameImg) {
    const c = document.createElement('canvas');
    c.width = frameImg.naturalWidth;
    c.height = frameImg.naturalHeight;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(frameImg, 0, 0);

    let data;
    try {
        data = cx.getImageData(0, 0, c.width, c.height);
    } catch {
        return null; // tainted (cross-origin, no CORS) — caller falls back
    }

    const px = data.data;

    // If the asset already carries real transparency, it's a proper cutout —
    // trust its alpha and only measure the bounding box. White-keying such an
    // image would punch holes in white/silver frames and lens highlights, so it
    // must NOT run here; it's only for opaque white-background catalog photos.
    let hasAlpha = false;
    for (let i = 3; i < px.length; i += 4) {
        // Any non-fully-opaque pixel (incl. anti-aliased edges at alpha 254)
        // means the asset carries a real alpha channel — don't white-key it.
        if (px[i] < 255) { hasAlpha = true; break; }
    }

    let minX = c.width, minY = c.height, maxX = 0, maxY = 0, found = false;
    // Per-row count of visible pixels, filled during the same pass as the
    // keying/bbox scan so the image is only traversed once.
    const rowWidths = new Uint32Array(c.height);
    for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
            const i = (y * c.width + x) * 4;
            if (!hasAlpha) {
                const mn = Math.min(px[i], px[i + 1], px[i + 2]);
                if (mn >= WHITE_CUTOFF) {
                    px[i + 3] = 0; // white background → fully transparent
                    continue;
                }
                if (mn >= WHITE_CUTOFF - WHITE_FEATHER) {
                    // Anti-aliased edge: fade alpha across the feather band.
                    px[i + 3] = Math.round(px[i + 3] * (WHITE_CUTOFF - mn) / WHITE_FEATHER);
                }
            }
            if (px[i + 3] > 12) {
                found = true;
                rowWidths[y]++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    // Only write back when we actually keyed pixels (opaque source).
    if (!hasAlpha) cx.putImageData(data, 0, 0);

    if (!found) return { canvas: c, sx: 0, sy: 0, sw: c.width, sh: c.height, lensFrac: 0.5 };

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;

    // Locate the LENS LINE inside the cutout: the widest horizontal band of a
    // glasses image is always the lens row (temples/nose pads are narrower).
    // Anchoring this row — rather than the bounding-box centre — to the eyes
    // keeps placement correct even when the asset includes temple arms above
    // or below the lenses, which otherwise skew the box and push the frame
    // off the eye line.
    let maxRow = 0;
    for (let y = minY; y <= maxY; y++) {
        if (rowWidths[y] > maxRow) maxRow = rowWidths[y];
    }
    let sumY = 0, n = 0;
    for (let y = minY; y <= maxY; y++) {
        if (rowWidths[y] >= maxRow * 0.8) { sumY += y - minY; n++; }
    }
    const lensFrac = n > 0 ? (sumY / n + 0.5) / bh : 0.5;

    return { canvas: c, sx: minX, sy: minY, sw: bw, sh: bh, lensFrac };
}

let multiplySupport = null;
/** Whether canvas 2D supports the 'multiply' blend mode (memoized). */
function supportsMultiply() {
    if (multiplySupport === null) {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        const cx = c.getContext('2d');
        cx.globalCompositeOperation = 'multiply';
        multiplySupport = cx.globalCompositeOperation === 'multiply';
    }
    return multiplySupport;
}

/**
 * Distance (in px, capped) from each pixel to the nearest pixel that is not
 * solidly opaque (alpha < 200 — so feathered edges count as boundary) — a
 * two-pass chamfer transform over the alpha channel. Lens interiors score
 * high; thin rims, temples and silhouette edges score low. This is how the
 * realism pass tells "glass" from "frame" without any color segmentation,
 * which would be hopeless for a dark lens inside a dark rim.
 */
function alphaDepthMap(px, w, h) {
    const INF = 0xffff;
    const d = new Uint16Array(w * h);
    for (let i = 0, p = 3; i < d.length; i++, p += 4) {
        d[i] = px[p] >= 200 ? INF : 0;
    }
    // Forward pass (left/top neighbours), then backward (right/bottom).
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (d[i] === 0) continue;
            let v = d[i];
            if (x > 0 && d[i - 1] + 1 < v) v = d[i - 1] + 1;
            if (y > 0 && d[i - w] + 1 < v) v = d[i - w] + 1;
            d[i] = v;
        }
    }
    for (let y = h - 1; y >= 0; y--) {
        for (let x = w - 1; x >= 0; x--) {
            const i = y * w + x;
            if (d[i] === 0) continue;
            let v = d[i];
            if (x < w - 1 && d[i + 1] + 1 < v) v = d[i + 1] + 1;
            if (y < h - 1 && d[i + w] + 1 < v) v = d[i + w] + 1;
            d[i] = v;
        }
    }
    return d;
}

/**
 * Sample the shopper's photo below the eyes (two cheek patches) to estimate
 * the scene's brightness and warmth, so the frame layer can be lit to match.
 * Photos come from the camera or a local file (data URLs), so the canvas is
 * never tainted here — but fail soft anyway.
 */
function samplePhotoLighting(photo, lx, ly, rx, ry, pd) {
    try {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 16;
        const cx = c.getContext('2d', { willReadFrequently: true });
        let r = 0, g = 0, b = 0, n = 0;
        const rad = Math.max(4, pd * 0.16);
        for (const [ex, ey] of [[lx, ly], [rx, ry]]) {
            cx.clearRect(0, 0, 16, 16);
            cx.drawImage(photo, ex - rad, ey + pd * 0.3, rad * 2, rad * 2, 0, 0, 16, 16);
            const p = cx.getImageData(0, 0, 16, 16).data;
            for (let i = 0; i < p.length; i += 4) {
                r += p[i]; g += p[i + 1]; b += p[i + 2]; n++;
            }
        }
        if (!n) return null;
        r /= n; g /= n; b /= n;
        return { r, g, b, luma: 0.299 * r + 0.587 * g + 0.114 * b };
    } catch {
        return null;
    }
}

/**
 * Realism pass over the prepared cutout — this is what stops the overlay
 * reading as a flat sticker:
 *  1. Lens transparency: deep-interior "glass" pixels get partial alpha so
 *     skin and eyes ghost through, scaled by how dark the tint is.
 *  2. Specular streaks: two soft diagonal highlight bands on the glass only,
 *     mimicking reflected shop/window light.
 *  3. Lighting match: the whole frame is brightness/warmth-shifted toward the
 *     scene sampled from the shopper's cheeks.
 * Mutates the prepared canvas in place and returns { shadow, tint }: a blurred
 * black silhouette canvas for the contact shadow and the multiply-blend lens
 * tint layer (tint is null for lens-less frames). Returns null when pixels are
 * unreadable or the image is not a cutout.
 */
function enhanceFrame(prepared, scene) {
    const { canvas, sx, sy, sw, sh } = prepared;
    const cx = canvas.getContext('2d', { willReadFrequently: true });
    let data;
    try {
        data = cx.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
        return null;
    }
    const px = data.data;
    const w = canvas.width;
    const h = canvas.height;

    // A real cutout always has transparent surroundings. If essentially
    // nothing is transparent, this is not a cutout — e.g. a legacy raw photo
    // stored before the admin upload pipeline existed, on a background the
    // white-keying didn't catch. The depth map would then read the WHOLE
    // rectangle as lens glass and tint/streak the entire photo, so leave such
    // images exactly as they are (no lighting, no shadow either).
    let clear = 0;
    for (let p = 3; p < px.length; p += 4) {
        if (px[p] === 0) clear++;
    }
    if (clear < w * h * 0.01) return null;

    const depth = alphaDepthMap(px, w, h);
    const rimPx = Math.max(2, sw * RIM_GUARD_FRAC);
    const lensPx = Math.max(rimPx + 2, sw * LENS_CORE_FRAC);

    // How dark is the glass? Averaged over the deep interior only.
    let lumSum = 0, lumN = 0;
    for (let i = 0, p = 0; i < depth.length; i++, p += 4) {
        if (depth[i] >= lensPx && px[p + 3] >= 200) {
            lumSum += 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
            lumN++;
        }
    }
    const hasLens = lumN >= sw * sh * LENS_MIN_AREA_FRAC;
    const tintLuma = lumN ? lumSum / lumN : 0;
    // Spec-band curve: darkest tints ~0.68 body alpha, near-clear ~0.12.
    const lensAlphaFloor = Math.min(
        LENS_ALPHA_MAX,
        Math.max(LENS_ALPHA_MIN, LENS_ALPHA_MAX - LENS_ALPHA_SLOPE * (tintLuma / 255))
    );

    // Multiply-blend tint layer: the lens color at glass-mask strength. Drawn
    // under the body layer with globalCompositeOperation 'multiply', it
    // darkens/colors the skin and eyes the way real glass filters light —
    // which is what lets the body alpha drop into the spec bands without the
    // tint washing out toward skin tone. Not built at all on the rare engine
    // without 'multiply' support — renderComposite couldn't draw it anyway.
    const tintData = hasLens && supportsMultiply() ? new ImageData(w, h) : null;
    const tp = tintData ? tintData.data : null;

    // Scene lighting adaptation factors (identity when sampling failed).
    const bright = scene ? Math.min(1.08, Math.max(0.86, (scene.luma + 60) / 195)) : 1;
    const warm = scene ? Math.min(0.06, Math.max(-0.06, (scene.r - scene.b) / 400)) : 0;
    const rFac = bright * (1 + warm);
    const gFac = bright;
    const bFac = bright * (1 - warm);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            const p = i * 4;
            if (px[p + 3] === 0) continue;

            // Lighting match applies to every visible pixel.
            if (scene) {
                px[p] = Math.min(255, px[p] * rFac);
                px[p + 1] = Math.min(255, px[p + 1] * gFac);
                px[p + 2] = Math.min(255, px[p + 2] * bFac);
            }

            if (!hasLens) continue;
            let t = (depth[i] - rimPx) / (lensPx - rimPx);
            if (t <= 0) continue;
            if (t > 1) t = 1;
            t = t * t * (3 - 2 * t); // smoothstep

            // 1a. tint layer pixel: the (lighting-adjusted) lens color, at
            // multiply strength scaled by the glass mask.
            if (tp) {
                tp[p] = px[p];
                tp[p + 1] = px[p + 1];
                tp[p + 2] = px[p + 2];
                tp[p + 3] = Math.round(255 * t * TINT_FILTER_STRENGTH * (px[p + 3] / 255));
            }

            // 1b. body transparency toward the tint's spec-band floor
            px[p + 3] = Math.round(px[p + 3] * (1 - t * (1 - lensAlphaFloor)));

            // 2. specular streaks along the photo diagonal (spec: 10–20%)
            const u = (x - sx) / sw + (y - sy) / sh;
            const s =
                t * 255 *
                (0.16 * Math.exp(-((u - 0.62) * (u - 0.62)) / 0.008) +
                 0.07 * Math.exp(-((u - 0.3) * (u - 0.3)) / 0.004));
            if (s >= 1) {
                px[p] = Math.min(255, px[p] + s);
                px[p + 1] = Math.min(255, px[p + 1] + s);
                px[p + 2] = Math.min(255, px[p + 2] + s);
            }
        }
    }
    cx.putImageData(data, 0, 0);

    // Blurred black silhouette for the contact shadow. ctx.filter is ignored
    // by a few older engines — the shadow just renders sharper there, and it's
    // drawn at low alpha either way.
    const sil = document.createElement('canvas');
    sil.width = w;
    sil.height = h;
    const sctx = sil.getContext('2d');
    sctx.filter = `blur(${Math.max(2, Math.round(sw * 0.012))}px)`;
    sctx.drawImage(canvas, 0, 0);
    sctx.filter = 'none';
    sctx.globalCompositeOperation = 'source-in';
    sctx.fillStyle = '#141008';
    sctx.fillRect(0, 0, w, h);

    let tint = null;
    if (tintData) {
        tint = document.createElement('canvas');
        tint.width = w;
        tint.height = h;
        tint.getContext('2d').putImageData(tintData, 0, 0);
    }
    return { shadow: sil, tint };
}

function loadImage(src, crossOrigin) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}

/**
 * Detect the face and prepare everything needed to render the try-on — without
 * baking the frame into the photo, so the user can nudge position/size and we
 * re-render cheaply.
 * @returns {Promise<{ photo, frame, place, tainted }>} where `place` holds the
 *   auto placement in image pixels and `frame` is the (cropped) frame source.
 */
async function composeTryOn(photoSrc, frameSrc) {
    const [photo, landmarker] = await Promise.all([
        loadImage(photoSrc),
        // Guard against a stalled WASM/model download hanging the UI forever.
        withTimeout(
            getLandmarker(),
            25000,
            'The try-on engine is taking too long to load. Check your connection and try again.'
        ),
    ]);

    const w = photo.naturalWidth;
    const h = photo.naturalHeight;
    if (!w || !h) throw new Error('Could not read the photo.');

    const result = landmarker.detect(photo);
    const faces = result?.faceLandmarks;
    if (!faces || faces.length === 0) {
        const err = new Error('No face detected. Use a clear, front-facing photo in good light.');
        err.code = 'NO_FACE';
        throw err;
    }
    const lm = faces[0];

    // Prefer iris centres for an accurate PD; fall back to outer eye corners.
    const left = lm[IRIS_LEFT] || lm[EYE_CORNER_LEFT];
    const right = lm[IRIS_RIGHT] || lm[EYE_CORNER_RIGHT];
    if (!left || !right) throw new Error('Could not locate the eyes in the photo.');

    // Landmarks are normalised [0..1]; convert to pixels.
    const lx = left.x * w;
    const ly = left.y * h;
    const rx = right.x * w;
    const ry = right.y * h;

    const eyeMidX = (lx + rx) / 2;
    const eyeMidY = (ly + ry) / 2;
    const pd = Math.hypot(rx - lx, ry - ly);
    const angle = Math.atan2(ry - ly, rx - lx);

    // Load the frame. Prefer a CORS-clean load so we can read pixels (accurate
    // bbox) and export (Save); if the host doesn't grant CORS the crossOrigin
    // load is blocked, so fall back to a normal load — the overlay still renders
    // (canvas tainted → bbox-scaling skipped, Save disabled).
    let frameImg;
    try {
        try {
            frameImg = await loadImage(frameSrc, true);
        } catch {
            frameImg = await loadImage(frameSrc, false);
        }
    } catch {
        throw new Error('Could not load the selected frame image.');
    }
    const prepared = prepareFrame(frameImg);

    // Realism pass — lens transparency + multiply tint, specular streaks,
    // scene lighting match and the contact-shadow silhouette. Skipped (null)
    // when the frame's pixels aren't readable OR the image isn't a real
    // cutout (enhanceFrame's no-transparency guard); both fall back to the
    // plain overlay as before.
    let fx = null;
    if (prepared) {
        const scene = samplePhotoLighting(photo, lx, ly, rx, ry, pd);
        fx = enhanceFrame(prepared, scene);
    }

    const srcW = prepared ? prepared.sw : frameImg.naturalWidth;
    const srcH = prepared ? prepared.sh : frameImg.naturalHeight;
    const frameW = pd * FRAME_WIDTH_TO_PD;
    const frameH = frameW * (srcH / srcW || 0.4);

    const frame = prepared
        ? {
            canvas: prepared.canvas,
            shadow: fx ? fx.shadow : null,
            tint: fx ? fx.tint : null,
            sx: prepared.sx, sy: prepared.sy, sw: prepared.sw, sh: prepared.sh,
        }
        : { img: frameImg };

    const place = {
        cx: eyeMidX,
        cy: eyeMidY + pd * FRAME_VERTICAL_OFFSET_TO_PD,
        w: frameW,
        h: frameH,
        angle,
        pd,
        // Fraction of the frame's height where the lens line sits (0.5 when
        // pixels aren't readable) — the draw anchors this row to the eye line.
        lensFrac: prepared ? prepared.lensFrac : 0.5,
    };

    // Probe whether the result can be exported (a cross-origin frame without
    // CORS taints the canvas: it still displays, but Save must be disabled).
    let tainted = false;
    const probe = renderComposite({ photo, frame, place }, DEFAULT_ADJUST);
    try {
        probe.toDataURL('image/png');
    } catch {
        tainted = true;
    }

    return { photo, frame, place, tainted };
}

const DEFAULT_ADJUST = { scale: 1, vFrac: 0, hFrac: 0 };

/**
 * Draw the photo with the frame overlaid at the auto placement plus the user's
 * adjustments. `vFrac`/`hFrac` are offsets in multiples of the pupillary
 * distance (so nudges feel consistent regardless of photo resolution); `scale`
 * multiplies the frame size. Returns a fresh canvas at the photo's resolution.
 */
function renderComposite({ photo, frame, place }, adjust) {
    const { cx, cy, w, h, angle, pd, lensFrac = 0.5 } = place;
    const canvas = document.createElement('canvas');
    canvas.width = photo.naturalWidth;
    canvas.height = photo.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(photo, 0, 0);

    const dw = w * adjust.scale;
    const dh = h * adjust.scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Manual nudges are applied AFTER the rotation so the Up/Down and
    // Left/Right sliders move along the face's own axes — on a tilted head a
    // vertical nudge stays perpendicular to the eye line instead of drifting
    // diagonally across it.
    ctx.translate(adjust.hFrac * pd, adjust.vFrac * pd);
    // Anchor the frame's lens line (not its box centre) on the eye line.
    if (frame.canvas) {
        // Soft contact shadow first, nudged down along the face axes, so the
        // glasses sit ON the skin instead of floating over it.
        if (frame.shadow) {
            ctx.globalAlpha = SHADOW_ALPHA;
            ctx.drawImage(
                frame.shadow,
                frame.sx, frame.sy, frame.sw, frame.sh,
                -dw / 2, -dh * lensFrac + dh * SHADOW_OFFSET_FRAC, dw, dh
            );
            ctx.globalAlpha = 1;
        }
        // Multiply tint under the body: real glass filters the light coming
        // through it, so skin and eyes show darkened + colored rather than
        // alpha-washed. Skipped silently on engines without 'multiply'.
        if (frame.tint) {
            ctx.globalCompositeOperation = 'multiply';
            if (ctx.globalCompositeOperation === 'multiply') {
                ctx.drawImage(frame.tint, frame.sx, frame.sy, frame.sw, frame.sh, -dw / 2, -dh * lensFrac, dw, dh);
            }
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.drawImage(frame.canvas, frame.sx, frame.sy, frame.sw, frame.sh, -dw / 2, -dh * lensFrac, dw, dh);
    } else {
        ctx.drawImage(frame.img, -dw / 2, -dh * lensFrac, dw, dh);
    }
    ctx.restore();
    return canvas;
}

const PhotoTryOn = ({ open, onClose, frameImage, name }) => {
    const [stage, setStage] = useState('choose'); // choose | camera | processing | result | error
    const [resultCanvas, setResultCanvas] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saveBlocked, setSaveBlocked] = useState(false);
    const [adjust, setAdjust] = useState(DEFAULT_ADJUST);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const resultHolderRef = useRef(null);
    const compositionRef = useRef(null); // { photo, frame, place, tainted }

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        stopStream();
        setStage('choose');
        setResultCanvas(null);
        setErrorMsg('');
        setSaveBlocked(false);
        setAdjust(DEFAULT_ADJUST);
        compositionRef.current = null;
    }, [stopStream]);

    // Release the camera whenever the modal closes or unmounts.
    useEffect(() => {
        if (!open) {
            stopStream();
            setStage('choose');
            setResultCanvas(null);
            setErrorMsg('');
            setSaveBlocked(false);
            setAdjust(DEFAULT_ADJUST);
            compositionRef.current = null;
        }
        return stopStream;
    }, [open, stopStream]);

    // Escape-to-close and background scroll lock while open, matching the app's
    // other dialogs.
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    // Mount the composed canvas straight into the DOM. Rendering the canvas
    // (rather than a toDataURL <img>) means the overlay still shows even when the
    // canvas is tainted by a cross-origin frame — only Save is disabled.
    useEffect(() => {
        const holder = resultHolderRef.current;
        if (stage === 'result' && holder && resultCanvas) {
            resultCanvas.classList.add('pto-result-canvas');
            holder.replaceChildren(resultCanvas);
        }
    }, [stage, resultCanvas]);

    const runComposite = useCallback(
        async (photoSrc) => {
            if (!frameImage) {
                setErrorMsg('No frame selected to try on.');
                setStage('error');
                return;
            }
            setStage('processing');
            try {
                const composition = await composeTryOn(photoSrc, frameImage);
                compositionRef.current = composition;
                setSaveBlocked(composition.tainted);
                setAdjust(DEFAULT_ADJUST);
                setStage('result'); // the redraw effect renders the canvas
            } catch (err) {
                setErrorMsg(err.message || 'Something went wrong. Please try another photo.');
                setStage('error');
            }
        },
        [frameImage]
    );

    // Update the fit; the redraw effect below repaints. Detection isn't
    // repeated — only the cheap composite redraw.
    const applyAdjust = useCallback((patch) => {
        setAdjust((prev) => ({ ...prev, ...patch }));
    }, []);

    // Repaint the composite whenever the fit changes or we enter the result
    // stage (kept out of the state updater so it isn't a side effect there).
    useEffect(() => {
        if (stage === 'result' && compositionRef.current) {
            setResultCanvas(renderComposite(compositionRef.current, adjust));
        }
    }, [adjust, stage]);

    const handleGallery = (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-picking the same file later
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => runComposite(ev.target.result);
        reader.onerror = () => {
            setErrorMsg('Could not read that image file.');
            setStage('error');
        };
        reader.readAsDataURL(file);
    };

    const startCamera = useCallback(async () => {
        setStage('camera');
        try {
            stopStream();
            // Portrait capture on phones (users hold them upright); landscape on
            // wider screens so the desktop modal doesn't tower past the fold.
            const wide = window.matchMedia('(min-width: 768px)').matches;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: wide
                    ? { facingMode: 'user', width: { ideal: 1440 }, height: { ideal: 1080 } }
                    : { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } },
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            setErrorMsg('Camera access was blocked. Allow camera permission, or use a gallery photo.');
            setStage('error');
        }
    }, [stopStream]);

    const capturePhoto = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Draw un-mirrored so detection and overlay share the same pixel space.
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        stopStream();
        runComposite(dataUrl);
    };

    const handleSave = () => {
        if (!resultCanvas || saveBlocked) return;
        try {
            const link = document.createElement('a');
            link.download = `tryon-${Date.now()}.png`;
            link.href = resultCanvas.toDataURL('image/png');
            link.click();
        } catch {
            // Tainted canvas — shouldn't reach here since Save is disabled, but
            // never throw from a click handler.
            setSaveBlocked(true);
        }
    };

    if (!open) return null;

    // Render through a portal to <body> so the fixed-position overlay is never
    // trapped by an ancestor that establishes a containing block (e.g. the
    // app's `.reveal-in` entrance-animation wrapper). Without this the overlay
    // sizes to the full page height and the centred modal lands below the fold.
    return createPortal(
        <div className="pto-overlay" role="dialog" aria-modal="true" aria-label="Photo try-on">
            <div className="pto-modal">
                <button className="pto-close" onClick={onClose} aria-label="Close">
                    <MdClose />
                </button>

                <div className="pto-header">
                    <h3>Photo Try-On</h3>
                    {name && <p className="pto-frame-name">{name}</p>}
                </div>

                <div className="pto-body">
                    {stage === 'choose' && (
                        <div className="pto-choose">
                            <p className="pto-hint">
                                Take a selfie or pick a clear, front-facing photo and we’ll place the frame on
                                your face automatically.
                            </p>
                            <div className="pto-choose-actions">
                                <button className="pto-btn primary" onClick={startCamera}>
                                    <MdCameraAlt /> Take a photo
                                </button>
                                <button className="pto-btn" onClick={() => fileInputRef.current?.click()}>
                                    <MdPhotoLibrary /> Choose from gallery
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleGallery}
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}

                    {stage === 'camera' && (
                        <div className="pto-camera">
                            <video ref={videoRef} autoPlay playsInline muted className="pto-video" />
                            <div className="pto-camera-actions">
                                <button className="pto-btn" onClick={reset}>
                                    Cancel
                                </button>
                                <button className="pto-btn primary" onClick={capturePhoto}>
                                    <MdCameraAlt /> Capture
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'processing' && (
                        <div className="pto-status">
                            <div className="pto-spinner" />
                            <p>Placing the frame on your face…</p>
                        </div>
                    )}

                    {stage === 'result' && (
                        <div className="pto-result">
                            <div ref={resultHolderRef} className="pto-result-holder" aria-label="Virtual try-on preview" />

                            <div className="pto-adjust">
                                <p className="pto-adjust-title">Adjust the fit</p>
                                <label className="pto-slider">
                                    <span>Size</span>
                                    <input
                                        type="range" min="0.6" max="1.6" step="0.02"
                                        value={adjust.scale}
                                        onChange={(e) => applyAdjust({ scale: parseFloat(e.target.value) })}
                                    />
                                </label>
                                <label className="pto-slider">
                                    <span>Up / Down</span>
                                    <input
                                        type="range" min="-0.6" max="0.6" step="0.02"
                                        value={adjust.vFrac}
                                        onChange={(e) => applyAdjust({ vFrac: parseFloat(e.target.value) })}
                                    />
                                </label>
                                <label className="pto-slider">
                                    <span>Left / Right</span>
                                    <input
                                        type="range" min="-0.6" max="0.6" step="0.02"
                                        value={adjust.hFrac}
                                        onChange={(e) => applyAdjust({ hFrac: parseFloat(e.target.value) })}
                                    />
                                </label>
                                <button type="button" className="pto-reset-link" onClick={() => applyAdjust(DEFAULT_ADJUST)}>
                                    Reset fit
                                </button>
                            </div>

                            {saveBlocked && (
                                <p className="pto-note">
                                    Preview only — this frame image can’t be saved from the browser.
                                </p>
                            )}
                            <div className="pto-result-actions">
                                <button className="pto-btn" onClick={reset}>
                                    <MdRefresh /> Try another photo
                                </button>
                                <button
                                    className="pto-btn primary"
                                    onClick={handleSave}
                                    disabled={saveBlocked}
                                >
                                    <MdDownload /> Save photo
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'error' && (
                        <div className="pto-status">
                            <p className="pto-error">{errorMsg}</p>
                            <button className="pto-btn primary" onClick={reset}>
                                <MdRefresh /> Try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PhotoTryOn;
