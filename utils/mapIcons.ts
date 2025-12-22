import L from 'leaflet';

// --- Global Leaflet Icon Fix ---
// This ensures default markers work correctly with Webpack/Vite bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Custom Icons ---

export const flagIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const userFlagIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export const targetIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#fbbf24; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export const measureTargetIcon = new L.DivIcon({
  className: 'custom-measure-icon',
  html: "<div style='background-color:transparent; width: 20px; height: 20px; border: 3px solid #60a5fa; border-radius: 50%; box-shadow: 0 0 4px black; display:flex; align-items:center; justify-content:center;'><div style='width:6px; height:6px; background-color:#60a5fa; border-radius:50%'></div></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export const draggableMeasureStartIcon = new L.DivIcon({
  className: 'measure-start-drag',
  html: `
    <div style="
      width: 48px; 
      height: 48px; 
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: move;
    ">
      <div style="
        width: 28px; 
        height: 28px; 
        background-color: white; 
        border-radius: 50%; 
        border: 5px solid #3b82f6; 
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background-color: #3b82f6; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

export const startMarkerIcon = new L.DivIcon({
  className: 'custom-start-icon',
  html: `
    <div style="
      width: 16px; 
      height: 16px; 
      background-color: #ffffff; 
      border-radius: 50%; 
      border: 4px solid #111827; 
      box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 4px 6px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export const ballIcon = new L.DivIcon({
  className: 'custom-ball-icon',
  html: `
    <div style="width: 14px; height: 14px; background-color: white; border-radius: 50%; border: 2px solid #333; box-shadow: 2px 2px 4px rgba(0,0,0,0.6);"></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

export const userLocationIcon = new L.DivIcon({
  className: 'user-location-icon',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-sm"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export const createArrowIcon = (rotation: number) => new L.DivIcon({
  className: 'bg-transparent pointer-events-none',
  html: `
    <div style="
      transform: rotate(${rotation}deg); 
      width: 0; 
      height: 0; 
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 20px solid #3b82f6;
      filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.5));
      opacity: 0.9;
      pointer-events: none; 
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export const createReplayLabelIcon = (text: string, rotation: number) => new L.DivIcon({
  className: 'custom-label-icon pointer-events-none',
  html: `
    <div style='
      transform: rotate(${rotation}deg); 
      color: #fff; 
      font-weight: 800;
      font-size: 11px; 
      text-align: center; 
      white-space: nowrap;
      text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 4px black;
      width: 120px;
      margin-left: -60px;
      margin-top: 10px;
      pointer-events: none;
    '>
      ${text}
    </div>`,
  iconSize: [0, 0], 
  iconAnchor: [0, 0] 
});

export const createDistanceLabelIcon = (text: string, rotation: number, color: string = '#ffffff') => new L.DivIcon({
  className: 'custom-label-icon pointer-events-none',
  html: `
    <div style='
      transform: rotate(${rotation}deg); 
      color: ${color}; 
      font-weight: 700;
      font-size: 10px; 
      text-align: center; 
      white-space: nowrap;
      background-color: rgba(0,0,0,0.8);
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      pointer-events: none;
    '>
      ${text}
    </div>`,
  iconSize: [0, 0], 
  iconAnchor: [20, 15] 
});

export const createAnnotationTextIcon = (text: string, rotation: number) => new L.DivIcon({
  className: 'custom-annotation-icon',
  html: `
    <div style='
      transform: rotate(${rotation}deg); 
      display: flex;
      flex-direction: column;
      align-items: center;
    '>
       <div style="
         background-color: rgba(0,0,0,0.8); 
         color: #facc15; 
         padding: 4px 8px; 
         border-radius: 6px; 
         font-size: 12px; 
         font-weight: bold; 
         white-space: nowrap;
         border: 1px solid rgba(250, 204, 21, 0.4);
         box-shadow: 0 2px 4px rgba(0,0,0,0.5);
       ">
        ${text}
       </div>
       <div style="width: 2px; height: 10px; background-color: rgba(250,204,21,0.5);"></div>
       <div style="width: 6px; height: 6px; background-color: #facc15; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 24]
});
