export type BodyRegionView = 'front' | 'back' | 'left' | 'right';

export interface BodyRegionHotspot {
  id: string;
  label: string;
  contentRegionId: string;
  group: 'Torso & head' | 'Arms' | 'Legs';
  hotspotPosition: string;
  hotspotNormal: string;
  cameraOrbit: string;
  cameraTarget: string;
  preferredView: BodyRegionView;
}

// These coordinates assume a web-optimised MakeHuman export in metres, standing
// upright with the feet at y=0 and facing +Z. Recalibrate here if the exported
// model uses a different origin or scale; the component code does not change.
export const bodyRegions: BodyRegionHotspot[] = [
  { id: 'neck', label: 'Neck', contentRegionId: 'neck', group: 'Torso & head', hotspotPosition: '0m 1.48m 0.105m', hotspotNormal: '0m 0m 1m', cameraOrbit: '0deg 76deg 1.25m', cameraTarget: '0m 1.47m 0m', preferredView: 'front' },
  { id: 'left-shoulder', label: 'Left shoulder', contentRegionId: 'shoulder', group: 'Arms', hotspotPosition: '0.245m 1.37m 0.03m', hotspotNormal: '0.7m 0m 0.7m', cameraOrbit: '-24deg 78deg 1.35m', cameraTarget: '0.21m 1.36m 0m', preferredView: 'front' },
  { id: 'right-shoulder', label: 'Right shoulder', contentRegionId: 'shoulder', group: 'Arms', hotspotPosition: '-0.245m 1.37m 0.03m', hotspotNormal: '-0.7m 0m 0.7m', cameraOrbit: '24deg 78deg 1.35m', cameraTarget: '-0.21m 1.36m 0m', preferredView: 'front' },
  { id: 'chest', label: 'Chest', contentRegionId: 'chest', group: 'Torso & head', hotspotPosition: '0m 1.22m 0.13m', hotspotNormal: '0m 0m 1m', cameraOrbit: '0deg 78deg 1.4m', cameraTarget: '0m 1.2m 0m', preferredView: 'front' },
  { id: 'abdomen', label: 'Abdomen', contentRegionId: 'abdomen', group: 'Torso & head', hotspotPosition: '0m 0.99m 0.12m', hotspotNormal: '0m 0m 1m', cameraOrbit: '0deg 78deg 1.35m', cameraTarget: '0m 0.98m 0m', preferredView: 'front' },
  { id: 'lower-abdomen', label: 'Lower abdomen / groin', contentRegionId: 'lower-abdomen-groin', group: 'Torso & head', hotspotPosition: '0m 0.79m 0.1m', hotspotNormal: '0m 0m 1m', cameraOrbit: '0deg 80deg 1.3m', cameraTarget: '0m 0.8m 0m', preferredView: 'front' },
  { id: 'upper-back', label: 'Upper back', contentRegionId: 'upper-back', group: 'Torso & head', hotspotPosition: '0m 1.24m -0.12m', hotspotNormal: '0m 0m -1m', cameraOrbit: '180deg 78deg 1.4m', cameraTarget: '0m 1.22m 0m', preferredView: 'back' },
  { id: 'lower-back', label: 'Lower back', contentRegionId: 'lower-back', group: 'Torso & head', hotspotPosition: '0m 0.98m -0.11m', hotspotNormal: '0m 0m -1m', cameraOrbit: '180deg 78deg 1.35m', cameraTarget: '0m 0.98m 0m', preferredView: 'back' },
  { id: 'left-hip', label: 'Left hip', contentRegionId: 'hip', group: 'Legs', hotspotPosition: '0.16m 0.82m 0.02m', hotspotNormal: '0.8m 0m 0.2m', cameraOrbit: '-55deg 80deg 1.3m', cameraTarget: '0.15m 0.81m 0m', preferredView: 'left' },
  { id: 'right-hip', label: 'Right hip', contentRegionId: 'hip', group: 'Legs', hotspotPosition: '-0.16m 0.82m 0.02m', hotspotNormal: '-0.8m 0m 0.2m', cameraOrbit: '55deg 80deg 1.3m', cameraTarget: '-0.15m 0.81m 0m', preferredView: 'right' },
  { id: 'left-elbow', label: 'Left elbow', contentRegionId: 'elbow', group: 'Arms', hotspotPosition: '0.38m 1.08m 0.01m', hotspotNormal: '1m 0m 0m', cameraOrbit: '-65deg 78deg 1.25m', cameraTarget: '0.35m 1.08m 0m', preferredView: 'left' },
  { id: 'right-elbow', label: 'Right elbow', contentRegionId: 'elbow', group: 'Arms', hotspotPosition: '-0.38m 1.08m 0.01m', hotspotNormal: '-1m 0m 0m', cameraOrbit: '65deg 78deg 1.25m', cameraTarget: '-0.35m 1.08m 0m', preferredView: 'right' },
  { id: 'left-wrist', label: 'Left wrist', contentRegionId: 'wrist', group: 'Arms', hotspotPosition: '0.48m 0.82m 0.01m', hotspotNormal: '1m 0m 0m', cameraOrbit: '-72deg 79deg 1.2m', cameraTarget: '0.44m 0.84m 0m', preferredView: 'left' },
  { id: 'right-wrist', label: 'Right wrist', contentRegionId: 'wrist', group: 'Arms', hotspotPosition: '-0.48m 0.82m 0.01m', hotspotNormal: '-1m 0m 0m', cameraOrbit: '72deg 79deg 1.2m', cameraTarget: '-0.44m 0.84m 0m', preferredView: 'right' },
  { id: 'left-thigh', label: 'Left thigh', contentRegionId: 'hip', group: 'Legs', hotspotPosition: '0.115m 0.59m 0.1m', hotspotNormal: '0m 0m 1m', cameraOrbit: '-12deg 80deg 1.25m', cameraTarget: '0.11m 0.58m 0m', preferredView: 'front' },
  { id: 'right-thigh', label: 'Right thigh', contentRegionId: 'hip', group: 'Legs', hotspotPosition: '-0.115m 0.59m 0.1m', hotspotNormal: '0m 0m 1m', cameraOrbit: '12deg 80deg 1.25m', cameraTarget: '-0.11m 0.58m 0m', preferredView: 'front' },
  { id: 'left-knee', label: 'Left knee', contentRegionId: 'knee', group: 'Legs', hotspotPosition: '0.105m 0.42m 0.09m', hotspotNormal: '0m 0m 1m', cameraOrbit: '-10deg 82deg 1.15m', cameraTarget: '0.1m 0.42m 0m', preferredView: 'front' },
  { id: 'right-knee', label: 'Right knee', contentRegionId: 'knee', group: 'Legs', hotspotPosition: '-0.105m 0.42m 0.09m', hotspotNormal: '0m 0m 1m', cameraOrbit: '10deg 82deg 1.15m', cameraTarget: '-0.1m 0.42m 0m', preferredView: 'front' },
  { id: 'left-calf', label: 'Left calf', contentRegionId: 'calf', group: 'Legs', hotspotPosition: '0.09m 0.24m -0.065m', hotspotNormal: '0m 0m -1m', cameraOrbit: '168deg 82deg 1.12m', cameraTarget: '0.09m 0.25m 0m', preferredView: 'back' },
  { id: 'right-calf', label: 'Right calf', contentRegionId: 'calf', group: 'Legs', hotspotPosition: '-0.09m 0.24m -0.065m', hotspotNormal: '0m 0m -1m', cameraOrbit: '192deg 82deg 1.12m', cameraTarget: '-0.09m 0.25m 0m', preferredView: 'back' },
  { id: 'left-ankle', label: 'Left ankle', contentRegionId: 'ankle', group: 'Legs', hotspotPosition: '0.085m 0.105m 0.015m', hotspotNormal: '0.7m 0m 0.7m', cameraOrbit: '-25deg 84deg 1.05m', cameraTarget: '0.085m 0.12m 0m', preferredView: 'front' },
  { id: 'right-ankle', label: 'Right ankle', contentRegionId: 'ankle', group: 'Legs', hotspotPosition: '-0.085m 0.105m 0.015m', hotspotNormal: '-0.7m 0m 0.7m', cameraOrbit: '25deg 84deg 1.05m', cameraTarget: '-0.085m 0.12m 0m', preferredView: 'front' },
  { id: 'left-foot', label: 'Left foot', contentRegionId: 'foot', group: 'Legs', hotspotPosition: '0.085m 0.035m 0.13m', hotspotNormal: '0m 0.3m 0.7m', cameraOrbit: '-18deg 84deg 1.05m', cameraTarget: '0.085m 0.06m 0.07m', preferredView: 'front' },
  { id: 'right-foot', label: 'Right foot', contentRegionId: 'foot', group: 'Legs', hotspotPosition: '-0.085m 0.035m 0.13m', hotspotNormal: '0m 0.3m 0.7m', cameraOrbit: '18deg 84deg 1.05m', cameraTarget: '-0.085m 0.06m 0.07m', preferredView: 'front' },
];

export const bodyRegionGroups = ['Torso & head', 'Arms', 'Legs'] as const;

export const getBodyRegionHotspot = (id?: string) => bodyRegions.find((region) => region.id === id);
