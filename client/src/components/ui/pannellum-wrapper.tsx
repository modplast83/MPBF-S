import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    // Clean up previous instance if it exists
    if (pannellumInstanceRef.current) {
      try {
        pannellumInstanceRef.current.destroy();
      } catch (e) {
        console.error('Error destroying previous panorama:', e);
      }
      pannellumInstanceRef.current = null;
    }

    // Dynamically import pannellum
    import('pannellum').then((pannellum) => {
      if (viewerRef.current) {
        try {
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

          setIsLoading(false);
        } catch (err: any) {
          console.error('Failed to initialize Pannellum:', err);
          setHasError(true);
          setErrorMessage(err.message || 'Failed to load panorama viewer');
          setIsLoading(false);
        }
      }
    }).catch(err => {
      console.error('Failed to load Pannellum:', err);
      setHasError(true);
      setErrorMessage(err.message || 'Failed to load panorama library');
      setIsLoading(false);
    });

    // Cleanup on unmount
    return () => {
      if (pannellumInstanceRef.current) {
        try {
          pannellumInstanceRef.current.destroy();
        } catch (e) {
          console.error('Error destroying panorama on unmount:', e);
        }
        pannellumInstanceRef.current = null;
      }
    };
  }, [image, pitch, yaw, hfov, autoLoad]);

  // Fallback component when panorama fails to load
  if (hasError) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-muted">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 text-xl font-semibold">
            {config.title || "Factory Area View"}
          </div>
          <img 
            src={image} 
            alt={config.title || "Factory View"} 
            className="max-w-full max-h-[300px] object-contain mb-4 rounded-md"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/800x400?text=Factory+Floor+View";
              e.currentTarget.alt = "Placeholder factory view";
            }}
          />
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {config.hotSpots && config.hotSpots.map((hotspot: any, index: number) => (
              <Button 
                key={index}
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (hotspot.type === 'scene' && onScenechange) {
                    onScenechange(hotspot.sceneId);
                  }
                }}
              >
                {hotspot.text || `Hotspot ${index + 1}`}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      ref={viewerRef} 
      style={{ 
        width: width, 
        height: height,
        backgroundColor: '#000000',
        position: 'relative'
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <div className="animate-pulse text-lg font-medium">Loading panorama view...</div>
        </div>
      )}
    </div>
  );
}