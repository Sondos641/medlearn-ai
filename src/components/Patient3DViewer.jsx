import React, { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Center, OrbitControls, useGLTF } from '@react-three/drei';

// IDs expected by the Physical Examination panel in StudentPractice.jsx.
const REGION_NAMES = {
  neck: ['region_neck'],
  heart: ['region_heart'],
  chest: ['region_chest'],
  upper: ['region_left_arm', 'region_right_arm'],
  hands: ['region_left_hand', 'region_right_hand'],
  lower: ['region_left_leg', 'region_right_leg'],
  feet: ['region_left_foot', 'region_right_foot'],
};

function getNamedRegion(object) {
  let current = object;
  while (current) {
    for (const [region, names] of Object.entries(REGION_NAMES)) {
      if (names.includes(current.name)) return region;
    }
    current = current.parent;
  }
  return null;
}

function PatientModel({ sex, onSelectRegion }) {
  const { scene } = useGLTF(`/models/${sex}_patient.glb`);
  const model = useMemo(() => scene.clone(true), [scene]);
  const bounds = useMemo(() => {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    return { min: box.min.clone(), size: box.getSize(new THREE.Vector3()) };
  }, [model]);

  const handleClick = (event) => {
    event.stopPropagation();
    if (typeof onSelectRegion !== 'function') return;

    // Prefer an explicitly named anatomical mesh when one is clicked.
    let region = getNamedRegion(event.object);

    // Otherwise use the actual clicked point on the body (not floating buttons).
    // This is a coarse fallback; named anatomical meshes are more precise.
    if (!region) {
      const point = model.worldToLocal(event.point.clone());
      const height = Math.max(bounds.size.y, 0.0001);
      const width = Math.max(bounds.size.x, 0.0001);
      const y = (point.y - bounds.min.y) / height;
      const x = (point.x - bounds.min.x) / width;
      const nearMiddle = Math.abs(x - 0.5) < 0.19;

      if (y < 0.12) region = 'feet';
      else if (y < 0.48) region = 'lower';
      else if (!nearMiddle && y < 0.73) region = 'hands';
      else if (!nearMiddle) region = 'upper';
      else if (y > 0.79) region = 'neck';
      else if (y > 0.63 && x > 0.42 && x < 0.61) region = 'heart';
      else region = 'chest';
    }

    onSelectRegion(region);
  };

  return (
    <Center>
      <primitive object={model} onClick={handleClick} />
    </Center>
  );
}

function CameraRig({ controlsRef, focus }) {
  const { camera } = useThree();
  const reset = () => {
    camera.position.set(0, 0.15, 3.8);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  };
  React.useEffect(() => {
    if (!controlsRef.current) return;
    if (focus === 'reset') reset();
    else if (focus === 'upper') { controlsRef.current.target.set(0, 0.48, 0); camera.position.set(0, 0.48, 2.2); controlsRef.current.update(); }
    else if (focus === 'lower') { controlsRef.current.target.set(0, -0.65, 0); camera.position.set(0, -0.65, 2.3); controlsRef.current.update(); }
  }, [focus, camera, controlsRef]);
  return null;
}

export default function Patient3DViewer({ sex = 'female', selectedRegion, onSelectRegion }) {
  const modelSex = /^(male|m)$/i.test(String(sex).trim()) ? 'male' : 'female';
  const controlsRef = useRef(null);
  const [focus, setFocus] = useState('reset');
  const [cameraMode, setCameraMode] = useState('rotate');
  const [revision, setRevision] = useState(0);
  const view = (next) => { setFocus(next); setRevision(v => v + 1); };
  return (
    <div className="patient-viewer" style={{width:'100%',height:'100%',minHeight:360,position:'relative',overflow:'hidden',borderRadius:12,background:'var(--cards, #25283b)'}}>
      <Canvas camera={{position:[0,0.15,3.8],fov:38}} style={{touchAction:'none'}}>
        <ambientLight intensity={1.6}/>
        <directionalLight position={[3,5,5]} intensity={2}/>
        <Suspense fallback={null}><PatientModel sex={modelSex} onSelectRegion={onSelectRegion}/></Suspense>
        <OrbitControls ref={controlsRef} makeDefault enablePan enableRotate enableZoom enableDamping
          mouseButtons={{LEFT:cameraMode==='pan'?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}}
          touches={{ONE:cameraMode==='pan'?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}}
          minDistance={0.8} maxDistance={9} minPolarAngle={0} maxPolarAngle={Math.PI} target={[0,0,0]}/>
        <CameraRig key={revision} controlsRef={controlsRef} focus={focus}/>
      </Canvas>
      <div className="patient-viewer-toolbar" style={{position:'absolute',right:10,top:10,display:'flex',flexDirection:'column',gap:6,zIndex:2}}>
        {[['rotate','↻ Rotate'],['pan','✥ Move'],['upper','Upper body'],['lower','Legs & feet'],['reset','Reset view']].map(([id,label])=>(
          <button key={id} type="button" onClick={()=>id==='rotate'||id==='pan'?setCameraMode(id):view(id)}
            aria-pressed={(id==='rotate'||id==='pan')?cameraMode===id:undefined}
            style={{background:(cameraMode===id?'#7668ac':'rgba(21,24,42,.92)'),color:'#fff',border:'1px solid #686483',borderRadius:8,padding:'7px 10px',fontSize:12,cursor:'pointer'}}>{label}</button>
        ))}
      </div>
      <div style={{position:'absolute',left:10,bottom:10,background:'rgba(15,23,42,.85)',color:'#fff',fontSize:11,padding:'7px 9px',borderRadius:8,pointerEvents:'none'}}>
        Drag to {cameraMode==='pan'?'move':'rotate'} · Wheel to zoom · Right-drag to move
        {selectedRegion ? ` · ${selectedRegion}` : ''}
      </div>
    </div>
  );
}

useGLTF.preload('/models/female_patient.glb');
useGLTF.preload('/models/male_patient.glb');
