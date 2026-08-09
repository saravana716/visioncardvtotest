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
// glasses width — not the padded photo — onto the face. ~2x PD ≈ face width.
const FRAME_WIDTH_TO_PD = 2.0;
// Pixels at/above this min-channel brightness are treated as white background
// and made transparent; a short feather band below it softens the cut edge.
const WHITE_CUTOFF = 232;
const WHITE_FEATHER = 16;
// Nudge the frame vertically from the eye line, in multiples of the PD
// (negative = up). Placement anchors the frame's LENS LINE to the pupils
// (see prepareFrame's lensFrac), so no static offset is needed; the user can
// fine-tune with the on-screen controls.
const FRAME_VERTICAL_OFFSET_TO_PD = 0;

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

    const srcW = prepared ? prepared.sw : frameImg.naturalWidth;
    const srcH = prepared ? prepared.sh : frameImg.naturalHeight;
    const frameW = pd * FRAME_WIDTH_TO_PD;
    const frameH = frameW * (srcH / srcW || 0.4);

    const frame = prepared
        ? { canvas: prepared.canvas, sx: prepared.sx, sy: prepared.sy, sw: prepared.sw, sh: prepared.sh }
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
