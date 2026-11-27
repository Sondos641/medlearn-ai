import React, { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
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

export default function Patient3DViewer({ sex = 'female', selectedRegion, onSelectRegion }) {
  const modelSex = /^(male|m)$/i.test(String(sex).trim()) ? 'male' : 'female';

  return (
    <div style={{
      width: '100%', height: 540, borderRadius: 16, overflow: 'hidden',
      background: 'var(--cards, #25283b)', position: 'relative',
    }}>
      <Canvas camera={{ position: [0, 0.2, 3.3], fov: 38 }}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 5, 5]} intensity={2} />
        <Suspense fallback={null}>
          <PatientModel sex={modelSex} onSelectRegion={onSelectRegion} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          minDistance={1.2}
          maxDistance={7}
          target={[0, 0, 0]}
        />
      </Canvas>
      <div style={{
        position: 'absolute', bottom: 12, left: 12, pointerEvents: 'none',
        fontSize: 12, padding: '7px 11px', borderRadius: 8,
        background: 'rgba(15,23,42,.8)', color: '#fff',
      }}>
        Click the patient to examine a region · Drag to rotate · Scroll to zoom
      </div>
      <div aria-live="polite" style={{
        position: 'absolute', top: 12, left: 12, pointerEvents: 'none',
        fontSize: 12, padding: '6px 10px', borderRadius: 8,
        background: 'rgba(15,23,42,.8)', color: '#fff',
      }}>
        {selectedRegion ? `Selected: ${selectedRegion}` : 'Select a body region'}
      </div>
    </div>
  );
}

useGLTF.preload('/models/female_patient.glb');
useGLTF.preload('/models/male_patient.glb');
