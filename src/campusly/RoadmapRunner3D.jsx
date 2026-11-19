import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useAnimations, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import studentModel from "@/assets/models/college-student.glb.asset.json";

// Feel constants for the walking student.
const WALK_SPEED = 1.15; // walk clip playback rate while scrolling
const FADE_SECONDS = 0.25; // idle <-> walk blend
const TURN_DAMPING = 9; // how quickly the student turns to face the road direction
const MODEL_HEIGHT = 2.1; // world units the model is scaled to

useGLTF.preload(studentModel.url);

function readHeading(el) {
  const runner = el?.closest?.(".roadmap-runner");
  if (!runner) return 0;
  const angle = parseFloat(getComputedStyle(runner).getPropertyValue("--roadmap-runner-angle")) || 0;
  // Screen-space travel direction -> yaw (model faces the camera at yaw 0, i.e. moving down the screen).
  return Math.atan2(Math.cos(angle), Math.sin(angle));
}

function Student({ running }) {
  const { scene, animations } = useGLTF(studentModel.url);
  const model = useMemo(() => {
    const copy = cloneSkinned(scene);
    copy.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    return copy;
  }, [scene]);
  const root = useRef(null);
  const { actions } = useAnimations(animations, root);
  const gl = useThree((s) => s.gl);
  const scale = useMemo(() => {
    const box = { min: Infinity, max: -Infinity };
    model.updateMatrixWorld(true);
    model.traverse((o) => {
      if (o.isMesh && o.geometry) {
        o.geometry.computeBoundingBox();
        box.min = Math.min(box.min, o.geometry.boundingBox.min.y);
        box.max = Math.max(box.max, o.geometry.boundingBox.max.y);
      }
    });
    const h = box.max - box.min;
    return Number.isFinite(h) && h > 0 ? MODEL_HEIGHT / h : 1;
  }, [model]);

  useEffect(() => {
    const walk = actions.walk;
    const idle = actions.idle;
    if (!walk || !idle) return;
    walk.timeScale = WALK_SPEED;
    const next = running ? walk : idle;
    const prev = running ? idle : walk;
    next.reset().fadeIn(FADE_SECONDS).play();
    prev.fadeOut(FADE_SECONDS);
  }, [running, actions]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = root.current;
    if (!g) return;
    const target = readHeading(gl.domElement);
    let diff = target - g.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += diff * (1 - Math.exp(-TURN_DAMPING * dt));
  });

  return (
    <group ref={root} scale={scale}>
      <primitive object={model} />
    </group>
  );
}

function SceneReady() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.domElement.parentElement?.setAttribute("data-scene-ready", "true");
  }, [gl]);
  return null;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn("3D roadmap student disabled:", error?.message);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Browsers without WebGL skip the decorative student instead of blanking the page.
export default function RoadmapRunner3D(props) {
  const [supported, setSupported] = useState(null);
  useEffect(() => setSupported(canUseWebGL()), []);
  if (!supported) return null;
  return (
    <SceneErrorBoundary>
      <RunnerCanvas {...props} />
    </SceneErrorBoundary>
  );
}

function RunnerCanvas({ running, active }) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 2.6, 6.2], fov: 26, near: 0.1, far: 30 }}
      onCreated={({ camera }) => camera.lookAt(0, 1, 0)}
      dpr={[1, 2]}
      frameloop={active ? "always" : "demand"}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      shadows
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#f3f8ff", "#33445b", 1.1]} />
      <directionalLight position={[-3, 6, 4]} intensity={2.2} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[3, 2, -3]} intensity={1.2} color="#7cc4ff" />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
        <Lightformer intensity={1} color="#ff7aa8" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        <Lightformer intensity={1} color="#6fd8ff" position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={3} blur={2.2} far={2} />
      <Suspense fallback={null}>
        <Student running={running} />
        <SceneReady />
      </Suspense>
    </Canvas>
  );
}
