import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MdVideocamOff, MdRefresh, MdCameraAlt, MdSwitchVideo, MdFace } from 'react-icons/md';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import './VTO.css';
import { PLACEHOLDER_IMG } from '../../utils/placeholderImage';


const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

// Error Boundary Component to prevent full page crashes
class CanvasErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Canvas Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
                    <p>Failed to initialize 3D view.</p>
                    <button onClick={() => this.setState({ hasError: false })} style={{ padding: '5px 15px', marginTop: '10px' }}>Try Again</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const Glasses = ({ textureUrl, matrix, scaleFactor = 1 }) => {
    const isGLB = textureUrl?.toLowerCase().endsWith('.glb') || textureUrl?.toLowerCase().endsWith('.gltf');
    const { scene } = isGLB ? useGLTF(textureUrl) : { scene: null };
    const [texture, setTexture] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const groupRef = useRef();

    // CUSTOM BENT GEOMETRY: This creates the "LensKart Curve" for 2D PNGs
    const curvedGeometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(2, 0.8, 32, 1);
        const pos = geo.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            const x = pos[i];
            pos[i + 2] = -Math.pow(x, 2) * 0.25;
        }
        geo.attributes.position.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
    }, []);

    useEffect(() => {
        if (!textureUrl || isGLB) return;
        let cancelled = false;
        let loadedTexture = null;
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
            textureUrl,
            (tex) => {
                if (cancelled) {
                    tex.dispose();
                    return;
                }
                loadedTexture = tex;
                setTexture(tex);
                setLoadError(false);
            },
            undefined,
            (err) => {
                if (cancelled) return;
                console.error("FAILED to load glasses texture:", textureUrl, err);
                setLoadError(true);
            }
        );
        return () => {
            cancelled = true;
            if (loadedTexture) loadedTexture.dispose();
            setTexture(null);
        };
    }, [textureUrl, isGLB]);

    useFrame(() => {
        if (groupRef.current && matrix) {
            groupRef.current.matrix.fromArray(matrix);
            groupRef.current.matrixAutoUpdate = false;
        }
    });

    if (loadError) return null;

    return (
        <group ref={groupRef}>
            {isGLB && scene ? (
                <primitive object={scene} scale={[scaleFactor * 0.02, scaleFactor * 0.02, scaleFactor * 0.02]} position={[0, 0.5, 0.15]} />
            ) : texture ? (
                <>
                    {/* MAIN FRAME */}
                    <mesh scale={[scaleFactor, scaleFactor, scaleFactor]} position={[0, 0.5, 0.15]}>
                        <planeGeometry args={[2, 0.8]} />
                        <meshStandardMaterial 
                            map={texture} 
                            transparent={true} 
                            alphaTest={0.5}
                            roughness={0.1}
                            metalness={0.4}
                            emissive="white"
                            emissiveIntensity={0.05}
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    {/* LENS SHINE */}
                    <mesh scale={[scaleFactor * 0.98, scaleFactor * 0.98, scaleFactor * 0.98]} position={[0, 0.5, 0.16]}>
                        <planeGeometry args={[2, 0.8]} />
                        <meshStandardMaterial 
                            color="white"
                            transparent={true}
                            opacity={0.05}
                            roughness={0}
                            metalness={1}
                        />
                    </mesh>
                </>
            ) : null}
        </group>
    );
};

// Global smoothing variables
let smoothedMatrix = new Float32Array(16);
const SMOOTHING_FACTOR = 0.1; // Instant tracking for better alignment

const VTOCore = ({ videoRef, frameImage, isStatic, onFaceShapeDetected }) => {
    const [faceLandmarker, setFaceLandmarker] = useState(null);
    const [matrix, setMatrix] = useState(null);
    const [scaleFactor, setScaleFactor] = useState(1);
    const [pd, setPd] = useState(0);

    useEffect(() => {
        const init = async () => {
            const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);
            const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
                runningMode: isStatic ? "IMAGE" : "VIDEO",
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
            });
            setFaceLandmarker(landmarker);
        };
        init();
    }, [isStatic]);

    useFrame(() => {
        if (!faceLandmarker || !videoRef.current) return;
        const element = videoRef.current;
        let results;
        if (isStatic) results = faceLandmarker.detect(element);
        else if (element.readyState === 4) results = faceLandmarker.detectForVideo(element, performance.now());

        if (results && results.facialTransformationMatrixes?.length > 0) {
            const rawMatrix = results.facialTransformationMatrixes[0].data;
            for (let i = 0; i < 16; i++) smoothedMatrix[i] = smoothedMatrix[i] * SMOOTHING_FACTOR + rawMatrix[i] * (1 - SMOOTHING_FACTOR);
            setMatrix([...smoothedMatrix]);
            
            if (results.faceLandmarks?.length > 0) {
                const landmarks = results.faceLandmarks[0];
                
                // LENSKART METHOD: Pupillary Distance (PD) Estimation
                // Landmarks 468 (Left Iris) and 473 (Right Iris)
                if (landmarks[468] && landmarks[473]) {
                    const irisL = landmarks[468];
                    const irisR = landmarks[473];
                    const currentPd = Math.sqrt(Math.pow(irisL.x - irisR.x, 2) + Math.pow(irisL.y - irisR.y, 2));
                    setPd(currentPd);

                    // Use PD-based scaling for absolute realism
                    // Average human PD is ~63mm. We use the PD ratio to lock the glasses scale.
                    setScaleFactor(Math.max(currentPd * 65.0, 0.5)); 
                }

                // FACE SHAPE DETECTION
                if (onFaceShapeDetected) {
                    const width = Math.abs(landmarks[454].x - landmarks[234].x);
                    const height = Math.abs(landmarks[152].y - landmarks[10].y);
                    const ratio = height / width;
                    let shape = "Oval";
                    if (ratio > 1.5) shape = "Long";
                    else if (ratio < 1.1) shape = "Round";
                    else if (ratio > 1.3) shape = "Square";
                    onFaceShapeDetected(shape);
                }
            }
        } else {
            setMatrix(null);
        }
    });

    return matrix ? (
        <group>
            <Glasses textureUrl={frameImage} matrix={matrix} scaleFactor={scaleFactor} />
        </group>
    ) : null;
};

const VTOCanvas = ({ frameImage, uploadedImage }) => {
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const streamRef = useRef(null);
    const [faceShape, setFaceShape] = useState("Analyzing...");
    const [cameraFacing, setCameraFacing] = useState("user");
    const [vtoStage, setVtoStage] = useState(uploadedImage ? 'active' : 'align'); // align -> success -> active

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (uploadedImage) return;
        try {
            stopStream(); // release any previous stream before opening a new one
            // Request a stream whose aspect matches the CSS box for this
            // viewport, so `object-fit: cover` crops as little as possible. The
            // breakpoints and ratios mirror --vto-aspect in VirtualTryOn.css
            // (3/4 at <=768px, 4/5 at <=480px); desktop stays wide 16/9.
            // aspectRatio is width/height, so a portrait box is < 1. We drive the
            // stream with aspectRatio + a width hint and let height follow, rather
            // than pinning width AND height to a contradictory pair.
            const mq = (q) => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches;
            let videoConstraints;
            if (mq('(max-width: 480px)')) {
                videoConstraints = { facingMode: cameraFacing, aspectRatio: { ideal: 4 / 5 }, width: { ideal: 720 } };
            } else if (mq('(max-width: 768px)')) {
                videoConstraints = { facingMode: cameraFacing, aspectRatio: { ideal: 3 / 4 }, width: { ideal: 720 } };
            } else {
                videoConstraints = { facingMode: cameraFacing, aspectRatio: { ideal: 16 / 9 }, width: { ideal: 1280 } };
            }
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints
            });
            streamRef.current = newStream;
            if (videoRef.current) videoRef.current.srcObject = newStream;
            setError(null);
        } catch (err) {
            console.error("Camera error:", err);
            setError("Camera access denied. Please enable camera permissions.");
        }
    }, [uploadedImage, cameraFacing, stopStream]);

    useEffect(() => {
        if (!uploadedImage) {
            startCamera();
        } else {
            // The user switched to an uploaded photo while the live camera was
            // running. Release the webcam now — otherwise it keeps streaming in
            // the background (camera light stays on) until unmount.
            stopStream();
            setIsLoaded(true);
        }
    }, [uploadedImage, cameraFacing, startCamera, stopStream]);

    // Always release the webcam on unmount. The previous cleanup captured a
    // stale `stream` value (the effect didn't depend on it), so on unmount it
    // stopped nothing and the camera light stayed on. Using a ref guarantees we
    // stop whatever stream is currently open.
    useEffect(() => stopStream, [stopStream]);

    const [capturedImage, setCapturedImage] = useState(null);

    const handleTakePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (cameraFacing === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        setVtoStage('success');
    };

    const takeScreenshot = () => {
        if (!containerRef.current) return;
        // In uploaded-photo mode there is no <video> — the background source is
        // the <img> (imageRef). Reading videoRef.current.videoWidth there threw a
        // TypeError and the capture silently failed. Pick the right source and
        // read its natural dimensions.
        const source = uploadedImage ? imageRef.current : videoRef.current;
        if (!source) return;
        // Use intrinsic dimensions: naturalWidth/Height for the uploaded <img>,
        // videoWidth/Height for the live <video>. (Layout width/height would give
        // the wrong capture resolution.)
        const srcWidth = uploadedImage ? source.naturalWidth : source.videoWidth;
        const srcHeight = uploadedImage ? source.naturalHeight : source.videoHeight;
        if (!srcWidth || !srcHeight) return;

        const canvas = document.createElement('canvas');
        const threeCanvas = containerRef.current.querySelector('canvas');
        canvas.width = srcWidth;
        canvas.height = srcHeight;
        const ctx = canvas.getContext('2d');
        // In live front-facing mode both the video AND the three.js overlay are
        // mirrored on screen (both carry CSS scaleX(-1)), so mirror both layers
        // together here — otherwise the saved glasses would be flipped relative
        // to what the user saw. Never mirror an uploaded photo.
        const mirror = !uploadedImage && cameraFacing === "user";
        ctx.save();
        if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        if (threeCanvas) ctx.drawImage(threeCanvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        const link = document.createElement('a');
        link.download = `vto-capture-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div ref={containerRef} className="vto-canvas-container" style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', background: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            
            {/* 1. CAMERA FEED */}
            {uploadedImage ? (
                <img ref={imageRef} src={uploadedImage} alt="Try on" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
            ) : (
                <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={() => setIsLoaded(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1, transform: cameraFacing === "user" ? 'scaleX(-1)' : 'none' }} />
            )}

            {/* 2. LENSKART ALIGNMENT STAGE */}
            {vtoStage === 'align' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <div className="vto-align-hint">
                        Face a light source, align your face, take off your glasses, and tuck your hair behind your ears
                    </div>
                    {/* The Dotted Green Oval — sized responsively via CSS variables */}
                    <div className="vto-align-oval"></div>
                    <button onClick={handleTakePhoto} style={{ position: 'absolute', bottom: '32px', marginBottom: 'env(safe-area-inset-bottom, 0px)', background: '#fff', color: '#000', padding: '12px 40px', borderRadius: '50px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                        Take Photo
                    </button>
                </div>
            )}

            {/* 3. LENSKART SUCCESS STAGE */}
            {vtoStage === 'success' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
                    <div className="vto-success-modal">
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', border: '3px solid #00387D' }}>
                             <img src={capturedImage || uploadedImage || PLACEHOLDER_IMG} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ color: '#000', marginBottom: '10px' }}>Your 3D has been successfully created!</h3>
                        <button onClick={() => setVtoStage('active')} style={{ width: '100%', background: '#00387D', color: '#fff', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
                            View frames in 3D
                        </button>
                    </div>
                </div>
            )}
            
            {/* 4. ACTIVE AR STAGE */}
            {isLoaded && !error && vtoStage === 'active' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}>
                    <CanvasErrorBoundary>
                        <Canvas gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} style={{ background: 'transparent', transform: cameraFacing === "user" ? 'scaleX(-1)' : 'none' }}>
                            <PerspectiveCamera makeDefault position={[0, 0, 1]} />
                            <ambientLight intensity={1.5} />
                            <pointLight position={[10, 10, 10]} intensity={2} />
                            <spotLight position={[-10, 10, 5]} angle={0.15} penumbra={1} intensity={1} />
                            <React.Suspense fallback={null}>
                                <VTOCore 
                                    videoRef={uploadedImage ? imageRef : videoRef} 
                                    frameImage={frameImage} 
                                    isStatic={!!uploadedImage}
                                    onFaceShapeDetected={setFaceShape}
                                />
                            </React.Suspense>
                        </Canvas>
                    </CanvasErrorBoundary>
                    
                    <div className="vto-ar-controls">
                        <button onClick={takeScreenshot} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '10px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <MdCameraAlt /> Capture
                        </button>
                        <button onClick={() => setCameraFacing(f => f === "user" ? "environment" : "user")} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '10px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <MdSwitchVideo /> Switch
                        </button>
                    </div>

                    <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,56,125,0.8)', backdropFilter: 'blur(10px)', color: '#fff', padding: '8px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', zIndex: 10, border: '1px solid rgba(255,255,255,0.2)' }}>
                        <MdFace style={{ fontSize: '1.2rem' }} />
                        <span>Shape: <strong>{faceShape}</strong></span>
                    </div>
                </div>
            )}

            {/* LOADER & ERROR */}
            {!isLoaded && !error && (
                <div className="vto-loader" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.85)', color: '#fff', flexDirection: 'column', zIndex: 3 }}>
                    <div className="loader-spinner"></div>
                    <p style={{ marginTop: '15px', fontWeight: '500' }}>Initializing 3D Experience...</p>
                </div>
            )}

            {error && (
                <div className="vto-error" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.95)', color: '#fff', padding: '40px', textAlign: 'center', zIndex: 20, flexDirection: 'column' }}>
                    <MdVideocamOff style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.8 }} />
                    <h3 style={{ marginBottom: '15px' }}>Camera Issue</h3>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.5', maxWidth: '400px', marginBottom: '25px' }}>{error}</p>
                    <button onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 30px', borderRadius: '50px', border: 'none', background: '#fff', color: '#00387D', fontWeight: '700', cursor: 'pointer' }}>
                        <MdRefresh /> Refresh Page
                    </button>
                </div>
            )}
        </div>
    );
};

export default VTOCanvas;
