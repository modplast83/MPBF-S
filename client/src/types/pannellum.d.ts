declare module 'pannellum' {
  interface ViewerConfig {
    type?: string;
    panorama?: string;
    autoLoad?: boolean;
    autoRotate?: number;
    autoRotateInactivityDelay?: number;
    autoRotateStopDelay?: number;
    preview?: string;
    pitch?: number;
    yaw?: number;
    hfov?: number;
    minHfov?: number;
    maxHfov?: number;
    compass?: boolean;
    northOffset?: number;
    preview?: string;
    previewTitle?: string;
    previewAuthor?: string;
    author?: string;
    title?: string;
    sceneFadeDuration?: number;
    draggable?: boolean;
    disableKeyboardCtrl?: boolean;
    showZoomCtrl?: boolean;
    keyboardZoom?: boolean;
    mouseZoom?: boolean;
    showFullscreenCtrl?: boolean;
    showControls?: boolean;
    hotSpots?: Array<{
      pitch: number;
      yaw: number;
      type: string;
      text?: string;
      URL?: string;
      sceneId?: string;
      targetPitch?: number;
      targetYaw?: number;
      targetHfov?: number;
      id?: string;
      cssClass?: string;
    }>;
    [key: string]: any;
  }

  interface Viewer {
    destroy(): void;
    getConfig(): ViewerConfig;
    getRenderer(): any;
    lookAt(pitch: number, yaw: number, hfov?: number, animated?: boolean): void;
    loadScene(sceneId: string, config?: ViewerConfig): void;
    isLoaded(): boolean;
    on(event: string, callback: (e?: any) => void): void;
    off(event: string, callback: (e?: any) => void): void;
    [key: string]: any;
  }

  function viewer(container: HTMLElement, config: ViewerConfig): Viewer;

  export { viewer, Viewer, ViewerConfig };
}