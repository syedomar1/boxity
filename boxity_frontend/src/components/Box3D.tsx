import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

type BoxState = 'sealed' | 'in-transit' | 'damaged';

interface Box3DProps {
  state?: BoxState;
  autoRotate?: boolean;
  className?: string;
}

function AnimatedBox({ state = 'sealed' }: { state: BoxState }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Define colors and deformation based on state
  const getBoxProps = () => {
    switch (state) {
      case 'sealed':
        return {
          color: '#4299e1',
          emissive: '#1e40af',
          scale: [1, 1, 1] as [number, number, number],
          position: [0, 0, 0] as [number, number, number],
        };
      case 'in-transit':
        return {
          color: '#f59e0b',
          emissive: '#d97706',
          scale: [1, 1, 1] as [number, number, number],
          position: [0, 0, 0] as [number, number, number],
        };
      case 'damaged':
        return {
          color: '#ef4444',
          emissive: '#dc2626',
          scale: [0.95, 1.05, 0.9] as [number, number, number],
          position: [0.1, 0, 0] as [number, number, number],
        };
    }
  };

  const props = getBoxProps();

  return (
    <group position={props.position}>
      <RoundedBox
        ref={meshRef}
        args={[2, 2, 2]}
        radius={0.05}
        smoothness={4}
        scale={props.scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={props.color}
          emissive={props.emissive}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          roughness={0.3}
          metalness={0.8}
        />
      </RoundedBox>
      
      {/* Damage indicator for damaged state */}
      {state === 'damaged' && (
        <mesh position={[1.05, 0, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

export const Box3D = ({ state = 'sealed', autoRotate = true, className = '' }: Box3DProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <AnimatedBox state={state} />
        {autoRotate && <OrbitControls enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
};
