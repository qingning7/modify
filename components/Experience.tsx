
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { LuxuryTree } from './LuxuryTree';
import { TreeConfig } from '../types';

interface ExperienceProps {
  config: TreeConfig;
}

export const Experience: React.FC<ExperienceProps> = ({ config }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Very slow, majestic rotation
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={40} />
      
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 2.5} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={15}
        maxDistance={35}
        dampingFactor={0.05}
      />

      {/* Cinematic Lighting Setup - Intensities lowered significantly */}
      <ambientLight intensity={0.1} color="#001100" />
      
      {/* Main Warm Light - Reduced from 60 to 30 */}
      <spotLight
        position={[10, 15, 10]}
        angle={0.5}
        penumbra={1}
        intensity={30}
        castShadow
        shadow-bias={-0.0001}
        color="#ffecd1"
      />
      
      {/* Rim Light for Emerald Definition - Reduced from 40 to 20 */}
      <spotLight 
        position={[-10, 5, -10]} 
        intensity={20} 
        color="#aaddff" 
        angle={0.6} 
      />

      {/* Luxury Reflections - Reduced intensity */}
      <Environment preset="lobby" environmentIntensity={0.5} />

      <group ref={groupRef}>
        <LuxuryTree treeState={config.treeState} />
      </group>

      {/* Floor */}
      <ContactShadows 
        resolution={1024} 
        scale={40} 
        blur={2} 
        opacity={0.5} 
        far={10} 
        color="#000000" 
      />
    </>
  );
};
