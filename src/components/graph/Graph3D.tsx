import * as React from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { ConvoGraph } from '@/src/types/graph';
import * as THREE from 'three';

interface Graph3DProps {
  graph: ConvoGraph;
}

export function Graph3D({ graph }: Graph3DProps) {
  const fgRef = React.useRef<ForceGraphMethods>(null);

  const data = React.useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    // Add Topics
    Object.values(graph.topics).forEach(topic => {
      nodes.push({
        id: topic.id,
        name: topic.label,
        type: 'topic',
        val: 15,
        color: '#e67e5f' // brand-orange
      });

      topic.conversation_ids.forEach(convoId => {
        links.push({
          source: topic.id,
          target: convoId,
          type: 'topic-convo'
        });
      });
    });

    // Add Conversations
    Object.values(graph.conversations).forEach(convo => {
      nodes.push({
        id: convo.id,
        name: convo.title || 'Untitled',
        type: 'conversation',
        val: 8,
        color: convo.rating ? (convo.rating.correctness === 'correct' ? '#4ade80' : '#f87171') : '#94a3b8'
      });
    });

    // Add Trajectories
    Object.values(graph.trajectories).forEach(traj => {
      nodes.push({
        id: traj.id,
        name: 'Trajectory',
        type: 'trajectory',
        val: 12,
        color: '#ff6b9d' // brand-pink
      });

      traj.conversation_ids.forEach(convoId => {
        links.push({
          source: traj.id,
          target: convoId,
          type: 'traj-convo'
        });
      });
    });

    // Add Skills
    Object.values(graph.skills).forEach(skill => {
      nodes.push({
        id: skill.id,
        name: skill.title,
        type: 'skill',
        val: 20,
        color: '#ffffff'
      });

      skill.source_trajectory_ids.forEach(trajId => {
        links.push({
          source: skill.id,
          target: trajId,
          type: 'skill-traj'
        });
      });
    });

    return { nodes, links };
  }, [graph]);

  const nodeThreeObject = React.useCallback((node: any) => {
    const group = new THREE.Group();
    
    // Main sphere
    const geometry = new THREE.SphereGeometry(node.val / 2, 16, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: node.color,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Add glow effect if it's a skill or topic
    if (node.type === 'skill' || node.type === 'topic') {
      const glowGeo = new THREE.SphereGeometry(node.val / 1.8, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.2
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      group.add(glow);
    }

    return group;
  }, []);

  return (
    <div className="w-full h-full bg-brand-bg rounded-xl overflow-hidden border border-border/50 relative">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeThreeObject={nodeThreeObject}
        linkWidth={1}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        onNodeClick={(node: any) => {
          // Aim at node from outside it
          const distance = 40;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

          fgRef.current?.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new pos
            node, // lookAt ({ x, y, z })
            3000  // ms transition duration
          );
        }}
      />
      <div className="absolute bottom-4 left-4 flex gap-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand-orange" />
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Topics</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand-pink" />
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Trajectories</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Conversations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white" />
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Skills</span>
        </div>
      </div>
    </div>
  );
}
