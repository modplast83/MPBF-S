import React, { useEffect, useRef } from 'react';

// Import the actual Pannellum script from the installed package
// This is a different approach than using the React component directly
type PannellumProps = {
  width?: string;
  height?: string;
  image: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  autoLoad?: boolean;
  onScenechange?: (sceneId: string) => void;
  config?: any;
};

export function PannellumWrapper({
  width = '100%',
  height = '100%',
  image,
  pitch = 10,
  yaw = 180,
  hfov = 110,
  autoLoad = true,
  onScenechange,
  config = {}
}: PannellumProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import pannellum
    import('pannellum').then((pannellum) => {
      if (viewerRef.current && !pannellumInstanceRef.current) {
        // Initialize viewer
        pannellumInstanceRef.current = pannellum.viewer(viewerRef.current, {
          type: 'equirectangular',
          panorama: image,
          autoLoad: autoLoad,
          pitch: pitch,
          yaw: yaw,
          hfov: hfov,
          ...config
        });

        // Add event listener for scene change
        if (onScenechange) {
          viewerRef.current.addEventListener('scenechange', (e: any) => {
            onScenechange(e.detail.sceneId);
          });
        }
      }
    }).catch(err => {
      console.error('Failed to load Pannellum:', err);
    });

    // Cleanup on unmount
    return () => {
      if (pannellumInstanceRef.current) {
        pannellumInstanceRef.current.destroy();
        pannellumInstanceRef.current = null;
      }
    };
  }, [image, pitch, yaw, hfov, autoLoad, config]);

  // Update panorama if image changes
  useEffect(() => {
    if (pannellumInstanceRef.current && image) {
      try {
        pannellumInstanceRef.current.loadScene('default', {
          panorama: image,
          pitch: pitch,
          yaw: yaw,
          hfov: hfov,
          ...config
        });
      } catch (e) {
        console.error('Error updating panorama:', e);
      }
    }
  }, [image, config]);

  return (
    <div 
      ref={viewerRef} 
      style={{ 
        width: width, 
        height: height,
        backgroundColor: '#000000' 
      }}
    />
  );
}