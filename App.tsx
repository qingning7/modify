
import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { Effects } from './components/Effects';
import { UI } from './components/UI';
import { TreeConfig, INITIAL_CONFIG } from './types';

function App() {
  const [config, setConfig] = useState<TreeConfig>(INITIAL_CONFIG);

  const updateConfig = useCallback((key: keyof TreeConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* UI Overlay */}
      <UI config={config} updateConfig={updateConfig} />

      {/* 3D Scene */}
      <Canvas
        shadows
        dpr={[1, 2]} // Handle high pixel density screens
        gl={{ 
          antialias: false, // Postprocessing handles AA better often, or we use SMAA in effects
          toneMapping: 3, // CineonToneMapping for cinematic look
          toneMappingExposure: 0.6 // Lowered to 0.6 for rich gold tones without washout
        }}
      >
        <Suspense fallback={null}>
          <Experience config={config} />
          <Effects />
        </Suspense>
      </Canvas>
      
      {/* Loading Indicator */}
      <Loader 
        containerStyles={{ background: '#000' }} 
        innerStyles={{ width: '200px', height: '2px', background: '#333' }}
        barStyles={{ background: '#D4AF37', height: '2px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'serif', fontSize: '1rem' }}
      />
    </div>
  );
}

export default App;
