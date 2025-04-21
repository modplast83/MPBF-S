declare module 'react-pannellum' {
  import { ReactNode, Component } from 'react';

  interface PannellumProps {
    width?: string;
    height?: string;
    image: string;
    pitch?: number;
    yaw?: number;
    hfov?: number;
    maxHfov?: number;
    minHfov?: number;
    autoLoad?: boolean;
    showZoomCtrl?: boolean;
    keyboardZoom?: boolean;
    mouseZoom?: boolean;
    draggable?: boolean;
    disableKeyboardCtrl?: boolean;
    showFullscreenCtrl?: boolean;
    showControls?: boolean;
    onLoad?: () => void;
    onError?: (err: Error) => void;
    onErrorcleared?: () => void;
    onMousedown?: (event: MouseEvent) => void;
    onMouseup?: (event: MouseEvent) => void;
    onTouchstart?: (event: TouchEvent) => void;
    onTouchend?: (event: TouchEvent) => void;
    onScenechange?: (id: string) => void;
    orientationOnByDefault?: boolean;
    hotspots?: Array<{
      pitch: number;
      yaw: number;
      type: string;
      text: string;
      URL?: string;
      sceneId?: string;
      targetPitch?: number;
      targetYaw?: number;
      targetHfov?: number;
      id?: string;
      cssClass?: string;
      createTooltipFunc?: (hotSpotDiv: HTMLDivElement, args: any) => void;
      createTooltipArgs?: any;
      clickHandlerFunc?: (e: MouseEvent, args: any) => void;
      clickHandlerArgs?: any;
      div?: HTMLDivElement;
    }>;
    config?: {
      autoLoad?: boolean;
      compass?: boolean;
      northOffset?: number;
      showZoomCtrl?: boolean;
      mouseZoom?: boolean;
      keyboardZoom?: boolean;
      showFullscreenCtrl?: boolean;
      disableKeyboardCtrl?: boolean;
      hotSpots?: Array<any>;
      title?: string;
      author?: string;
      sceneFadeDuration?: number;
    };
  }

  export class Pannellum extends Component<PannellumProps> {
    constructor(props: PannellumProps);
  }
}