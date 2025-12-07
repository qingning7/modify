
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';

interface LuxuryTreeProps {
  treeState: 'CHAOS' | 'FORMED';
}

const FOLIAGE_COUNT = 25000;
const GIFTS_COUNT = 40;
const BAUBLES_COUNT = 250;
const LIGHTS_COUNT = 600;

const EXPLOSION_RADIUS = 45;

// --- UTILS ---
const randomSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

const getTreePosition = (index: number, total: number, height: number, baseRadius: number, spread: number = 1) => {
    const t = index / total;
    const h = t * height - height / 2;
    const r = baseRadius * (1 - t) + (Math.random() - 0.5) * spread;
    const theta = index * 2.39996 * 5 + Math.random() * 0.5; // Golden angle + jitter
    
    return new THREE.Vector3(
        r * Math.cos(theta),
        h,
        r * Math.sin(theta)
    );
};

// --- SHADERS ---
const FoliageShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColorBase: { value: new THREE.Color('#004225') }, // Deep Emerald
        uColorRim: { value: new THREE.Color('#D4AF37') }, // Gold
    },
    vertexShader: `
      uniform float uTime;
      uniform float uProgress;
      attribute vec3 chaosPos;
      attribute vec3 targetPos;
      attribute float size;
      attribute float random;
      
      varying vec2 vUv;
      varying float vRandom;
      varying float vAlpha;

      float easeInOutQuart(float x) {
        return x < 0.5 ? 8.0 * x * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 4.0) / 2.0;
      }

      void main() {
        vUv = uv;
        vRandom = random;
        
        // Progress with noise
        float localProgress = clamp(uProgress * 1.2 - random * 0.2, 0.0, 1.0);
        localProgress = easeInOutQuart(localProgress);

        vec3 pos = mix(chaosPos, targetPos, localProgress);
        
        // Breathing / Wind Effect
        float breath = sin(uTime * 2.0 + random * 10.0) * 0.5 + 0.5; // 0 to 1
        
        // Formed State: Gentle Wind
        if (localProgress > 0.8) {
            float wind = sin(uTime * 1.0 + pos.y * 0.5) * 0.1;
            pos.x += wind;
            pos.z += wind * 0.5;
        } 
        // Chaos State: Floating
        else {
             pos.y += sin(uTime + pos.x) * 0.2;
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size attenuation with breathing pulse
        float sizePulse = size * (1.0 + breath * 0.2); 
        gl_PointSize = sizePulse * (250.0 / -mvPosition.z);
        
        vAlpha = 0.8 + 0.2 * breath;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorBase;
      uniform vec3 uColorRim;
      varying float vRandom;
      varying float vAlpha;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if(dist > 0.5) discard;

        // Radial Gradient: Emerald Center -> Gold Rim
        float strength = 1.0 - (dist * 2.0);
        strength = pow(strength, 1.5);

        // Rim Light Calculation
        float rim = smoothstep(0.3, 0.5, dist);
        
        // Toned down brightness
        vec3 color = mix(uColorBase * 0.8, uColorRim, rim * 0.6);
        
        // Add extra glitter
        if (vRandom > 0.95) {
             color += vec3(0.5); 
        }

        // Reduced multiplier from 1.2 to 1.0 to prevent overexposure
        gl_FragColor = vec4(color, vAlpha * strength);
      }
    `
};

export const LuxuryTree: React.FC<LuxuryTreeProps> = ({ treeState }) => {
  const foliageMat = useRef<THREE.ShaderMaterial>(null);
  
  // Instance Refs
  const giftsRef = useRef<THREE.InstancedMesh>(null);
  const baublesRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  
  // Logic state
  const targetProgress = treeState === 'FORMED' ? 1 : 0;
  const currentProgress = useRef(targetProgress);

  // --- 1. FOLIAGE GEOMETRY ---
  const foliageGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const chaosPositions = [];
    const targetPositions = [];
    const sizes = [];
    const randoms = [];

    const height = 16;
    const baseRadius = 7;

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
        const chaos = randomSpherePoint(EXPLOSION_RADIUS);
        
        // Cone distribution
        const h = Math.random() * height; 
        const relHeight = h / height;
        const currentRadius = baseRadius * (1 - relHeight);
        const r = Math.sqrt(Math.random()) * currentRadius; 
        const theta = Math.random() * Math.PI * 2;
        
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = h - height/2;

        chaosPositions.push(chaos.x, chaos.y, chaos.z);
        targetPositions.push(x, y, z);
        sizes.push(Math.random() * 0.5 + 0.2);
        randoms.push(Math.random());
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(targetPositions, 3));
    geo.setAttribute('chaosPos', new THREE.Float32BufferAttribute(chaosPositions, 3));
    geo.setAttribute('targetPos', new THREE.Float32BufferAttribute(targetPositions, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('random', new THREE.Float32BufferAttribute(randoms, 1));
    return geo;
  }, []);

  // --- 2. ORNAMENTS DATA GENERATOR ---
  const createOrnamentData = (count: number, type: 'GIFT' | 'BAUBLE' | 'LIGHT') => {
      const items = [];
      const height = 14;
      const baseRadius = 6.5;

      for (let i = 0; i < count; i++) {
        const chaos = randomSpherePoint(EXPLOSION_RADIUS * (type === 'LIGHT' ? 1.2 : 1.0));
        
        // Different distribution per type
        let target = new THREE.Vector3();
        let scale = 1.0;
        let color = new THREE.Color();

        if (type === 'GIFT') {
            // Gifts mostly at bottom
            const t = i / count; // 0 to 1
            const h = t * (height * 0.4) - height/2 + 1; // Bottom 40%
            const r = (baseRadius * (1 - (h + height/2)/height)) * 0.8 + Math.random(); 
            const theta = Math.random() * Math.PI * 2;
            target.set(r * Math.cos(theta), h, r * Math.sin(theta));
            scale = Math.random() * 0.5 + 0.5;
            // Rich saturated colors
            const colors = ['#8a0303', '#004225', '#D4AF37']; 
            color.set(colors[Math.floor(Math.random() * colors.length)]);
        } 
        else if (type === 'BAUBLE') {
            const pos = getTreePosition(i, count, height - 2, baseRadius, 0.2);
            target.copy(pos);
            scale = Math.random() * 0.3 + 0.3;
            // Metals
            const colors = ['#FFD700', '#C0C0C0', '#B8860B', '#AA0000']; 
            color.set(colors[Math.floor(Math.random() * colors.length)]);
        }
        else { // LIGHT
            const pos = getTreePosition(i, count, height, baseRadius + 0.5, 0.5);
            target.copy(pos);
            scale = Math.random() * 0.15 + 0.1;
            color.set('#ffecd1'); // Warm white
        }

        items.push({ chaos, target, scale, color });
      }
      return items;
  };

  const giftsData = useMemo(() => createOrnamentData(GIFTS_COUNT, 'GIFT'), []);
  const baublesData = useMemo(() => createOrnamentData(BAUBLES_COUNT, 'BAUBLE'), []);
  const lightsData = useMemo(() => createOrnamentData(LIGHTS_COUNT, 'LIGHT'), []);

  // --- 3. STAR GEOMETRY ---
  const starGeometry = useMemo(() => {
      const shape = new THREE.Shape();
      const points = 5;
      const outerRadius = 1.3;
      const innerRadius = 0.5;
      
      for (let i = 0; i < points * 2; i++) {
          const angle = (i * Math.PI) / points;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          // Calculate around (0,0)
          const x = Math.cos(angle + Math.PI / 2) * radius;
          const y = Math.sin(angle + Math.PI / 2) * radius;
          
          if (i === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
      }
      shape.closePath();

      const depth = 0.5;
      const geo = new THREE.ExtrudeGeometry(shape, {
          depth: depth,
          bevelEnabled: true,
          bevelThickness: 0.15,
          bevelSize: 0.1,
          bevelSegments: 4
      });
      // Center ONLY on Z axis to keep the geometric center of the star intact in X/Y
      geo.translate(0, 0, -depth / 2);
      return geo;
  }, []);

  // --- FRAME LOOP ---
  useFrame((state, delta) => {
    // 1. Global Progress
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, targetProgress, delta * 2.0);
    const P = currentProgress.current;
    const time = state.clock.elapsedTime;

    // 2. Foliage
    if (foliageMat.current) {
        foliageMat.current.uniforms.uTime.value = time;
        foliageMat.current.uniforms.uProgress.value = P;
    }

    // 3. Ornaments Update Helper
    const updateMesh = (
        ref: React.RefObject<THREE.InstancedMesh>, 
        data: any[], 
        speedMultiplier: number, 
        floatIntensity: number,
        type: 'GIFT' | 'BAUBLE' | 'LIGHT'
    ) => {
        if (!ref.current) return;
        const dummy = new THREE.Object3D();
        
        data.forEach((item, i) => {
            // Custom ease per item
            const noise = (i % 10) * 0.05;
            let localP = THREE.MathUtils.smoothstep(P, 0 + noise, 1.0 - noise);
            
            const currentPos = new THREE.Vector3().lerpVectors(item.chaos, item.target, localP);

            // Chaos Floating Animation
            if (localP < 0.95) {
                const floatSpeed = type === 'LIGHT' ? 2.0 : (type === 'BAUBLE' ? 1.0 : 0.5);
                currentPos.y += Math.sin(time * floatSpeed + i) * floatIntensity * (1 - localP);
                currentPos.x += Math.cos(time * floatSpeed * 0.5 + i) * floatIntensity * 0.5 * (1 - localP);
            }

            dummy.position.copy(currentPos);
            
            // Rotation
            const rotSpeed = type === 'LIGHT' ? 3 : 1;
            dummy.rotation.set(
                time * rotSpeed * 0.1 + i, 
                time * rotSpeed * 0.1 + i, 
                0
            );

            // Scale popping
            const pop = localP > 0.8 ? 1.0 + Math.sin(time * 3 + i) * 0.05 : 1.0;
            dummy.scale.setScalar(item.scale * pop);

            dummy.updateMatrix();
            ref.current!.setMatrixAt(i, dummy.matrix);
            
            // Set Color once
            ref.current!.setColorAt(i, item.color);
        });
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    };

    updateMesh(giftsRef, giftsData, 0.5, 0.5, 'GIFT');
    updateMesh(baublesRef, baublesData, 1.0, 2.0, 'BAUBLE');
    updateMesh(lightsRef, lightsData, 2.0, 5.0, 'LIGHT');

  });

  return (
    <group>
        {/* 1. NEEDLES */}
        <points geometry={foliageGeometry} frustumCulled={false}>
            <shaderMaterial 
                ref={foliageMat}
                args={[FoliageShaderMaterial]}
                transparent
                depthWrite={false}
                blending={THREE.NormalBlending} 
            />
        </points>

        {/* 2. HEAVY GIFTS (Boxes) */}
        <instancedMesh ref={giftsRef} args={[undefined, undefined, GIFTS_COUNT]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.3} metalness={0.1} />
        </instancedMesh>

        {/* 3. BAUBLES (Spheres) */}
        <instancedMesh ref={baublesRef} args={[undefined, undefined, BAUBLES_COUNT]} castShadow receiveShadow>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial roughness={0.1} metalness={0.9} envMapIntensity={1} />
        </instancedMesh>

        {/* 4. LIGHTS (Diamonds/Stars) */}
        <instancedMesh ref={lightsRef} args={[undefined, undefined, LIGHTS_COUNT]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial 
                emissive="#ffecd1" 
                emissiveIntensity={2} 
                toneMapped={false}
                color="#ffecd1"
            />
        </instancedMesh>

        {/* TOPPER: STAR */}
        {/* Placed at y=8.2 (Tip of 16h tree is 8.0) to sit perfectly on top */}
        <group scale={treeState === 'FORMED' ? 1 : 0} className="transition-transform duration-1000 ease-out delay-500">
             <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
                <mesh position={[0, 8.2, 0]}>
                    <primitive object={starGeometry} />
                    <meshStandardMaterial 
                        color="#FFF" 
                        emissive="#FFD700"
                        emissiveIntensity={0.8}
                        roughness={0.1}
                        metalness={1}
                    />
                    <Sparkles count={30} scale={4} size={20} speed={0.4} opacity={1} color="#FFF" />
                </mesh>
             </Float>
             <pointLight position={[0, 8.5, 0]} intensity={10} color="#FFD700" distance={10} decay={2} />
        </group>
    </group>
  );
};
