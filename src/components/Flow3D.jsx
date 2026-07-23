"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { layout3d, nodeColor } from "@/lib/layout3d";

function Node({ node }) {
  const color = nodeColor(node.kind);
  return (
    <group position={node.position}>
      <mesh>
        <boxGeometry args={[2.2, 0.9, 0.5]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
      <Text
        position={[0, 0, 0.28]}
        fontSize={0.26}
        maxWidth={2}
        textAlign="center"
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  );
}

function Edge({ edge }) {
  const points = useMemo(() => [edge.from3, edge.to3], [edge]);
  const mid = [
    (edge.from3[0] + edge.to3[0]) / 2,
    (edge.from3[1] + edge.to3[1]) / 2 + 0.3,
    (edge.from3[2] + edge.to3[2]) / 2,
  ];
  return (
    <>
      <Line points={points} color="#7c8aa5" lineWidth={2} />
      {edge.label ? (
        <Text
          position={mid}
          fontSize={0.22}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
        >
          {edge.label}
        </Text>
      ) : null}
    </>
  );
}

export default function Flow3D({ flow }) {
  const { nodes, edges } = useMemo(() => layout3d(flow), [flow]);

  return (
    <div className="h-[520px] w-full rounded-lg overflow-hidden bg-[#0a0e18]">
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1.1} />
        <pointLight position={[-8, -4, -8]} intensity={0.4} color="#6366f1" />

        {edges.map((e, i) => (
          <Edge key={i} edge={e} />
        ))}
        {nodes.map((n) => (
          <Node key={n.id} node={n} />
        ))}

        <OrbitControls enableDamping makeDefault />
      </Canvas>
      <p className="text-center text-xs text-slate-500 -mt-6 relative pointer-events-none">
        Drag to rotate · scroll to zoom
      </p>
    </div>
  );
}
