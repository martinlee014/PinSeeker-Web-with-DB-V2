
import { LatLng, ClubStats } from '../types';

const EARTH_RADIUS = 6378137.0; // Meters

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const calculateDistance = (p1: LatLng, p2: LatLng): number => {
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
};

export const calculateBearing = (start: LatLng, end: LatLng): number => {
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const dLon = toRad(end.lng - start.lng);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

export const calculateDestination = (start: LatLng, distanceMeters: number, bearingDegrees: number): LatLng => {
  const radLat = toRad(start.lat);
  const radLon = toRad(start.lng);
  const radBearing = toRad(bearingDegrees);
  const angularDist = distanceMeters / EARTH_RADIUS;

  const endLat = Math.asin(
    Math.sin(radLat) * Math.cos(angularDist) +
    Math.cos(radLat) * Math.sin(angularDist) * Math.cos(radBearing)
  );

  const endLon = radLon + Math.atan2(
    Math.sin(radBearing) * Math.sin(angularDist) * Math.cos(radLat),
    Math.cos(angularDist) - Math.sin(radLat) * Math.sin(endLat)
  );

  return {
    lat: toDeg(endLat),
    lng: toDeg(endLon),
  };
};

export const calculateWindAdjustedShot = (
  start: LatLng,
  baseDistance: number,
  bearing: number,
  windSpeed: number,
  windDir: number
): { destination: LatLng; playsLike: number } => {
  const relativeWindAngle = (windDir - bearing + 180) % 360;
  const windRad = toRad(relativeWindAngle);
  
  const headWindComp = windSpeed * Math.cos(windRad);
  const crossWindComp = windSpeed * Math.sin(windRad);
  
  const distEffect = headWindComp * 0.01 * baseDistance; 
  const sideEffect = crossWindComp * 0.005 * baseDistance;
  
  const newDistance = baseDistance - distEffect;
  const bearingShift = toDeg(Math.atan2(sideEffect, newDistance));
  
  return {
    destination: calculateDestination(start, newDistance, bearing + bearingShift),
    playsLike: newDistance
  };
};

export const getEllipsePoints = (center: LatLng, width: number, height: number, rotation: number): LatLng[] => {
  const points: LatLng[] = [];
  const rotationRad = toRad(rotation);
  const segments = 36;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const dx = (width / 2) * Math.cos(theta);
    const dy = (height / 2) * Math.sin(theta);
    
    const rx = dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
    const ry = dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
    
    const dLat = ry / EARTH_RADIUS;
    const dLon = rx / (EARTH_RADIUS * Math.cos(toRad(center.lat)));
    
    points.push({
      lat: center.lat + toDeg(dLat),
      lng: center.lng + toDeg(dLon)
    });
  }
  return points;
};

export const getArcPoints = (start: LatLng, end: LatLng): LatLng[] => {
  const points: LatLng[] = [];
  const numPoints = 20;
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  const bearing = calculateBearing(start, end);
  const dist = calculateDistance(start, end);
  const offsetMeters = dist * 0.1; 
  const controlPoint = calculateDestination({lat: midLat, lng: midLng}, offsetMeters, bearing - 90);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlPoint.lat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlPoint.lng + t * t * end.lng;
    points.push({ lat, lng });
  }
  return points;
};

export const formatDistance = (meters: number, useYards: boolean): string => {
  if (useYards) {
    return `${Math.round(meters * 1.09361)}yd`;
  }
  return `${Math.round(meters)}m`;
};

/**
 * Calculates the Front, Back, Left, and Right points of a green polygon
 * relative to the player's perspective (bearing to center).
 */
export const getDynamicGreenEdges = (
    playerPos: LatLng,
    greenCenter: LatLng,
    greenShape: LatLng[]
): { front: LatLng, back: LatLng, left: LatLng, right: LatLng } => {
    if (!greenShape || greenShape.length === 0) {
        // Fallback: Circular approximation (13.7m radius)
        const bearing = calculateBearing(playerPos, greenCenter);
        return {
            front: calculateDestination(greenCenter, 13.7, bearing + 180),
            back: calculateDestination(greenCenter, 13.7, bearing),
            left: calculateDestination(greenCenter, 10, bearing - 90),
            right: calculateDestination(greenCenter, 10, bearing + 90),
        };
    }

    const bearingToCenter = calculateBearing(playerPos, greenCenter);
    // Rotate coordinates so bearingToCenter becomes "North" (0 degrees)
    // This simplifies finding min/max Y (Front/Back) and min/max X (Left/Right)
    const rotationRad = toRad(-bearingToCenter);

    let minDepth = Infinity, maxDepth = -Infinity;
    let minWidth = Infinity, maxWidth = -Infinity;
    let frontPt = greenShape[0], backPt = greenShape[0];
    let leftPt = greenShape[0], rightPt = greenShape[0];

    greenShape.forEach(pt => {
        // Approximate projection to meters relative to center
        const dLat = (pt.lat - greenCenter.lat) * (Math.PI / 180) * EARTH_RADIUS;
        const dLon = (pt.lng - greenCenter.lng) * (Math.PI / 180) * EARTH_RADIUS * Math.cos(toRad(greenCenter.lat));

        // Rotate
        const x = dLon * Math.cos(rotationRad) - dLat * Math.sin(rotationRad);
        const y = dLon * Math.sin(rotationRad) + dLat * Math.cos(rotationRad);

        // Project onto the line of play
        const distToPt = calculateDistance(greenCenter, pt);
        const bearingToPt = calculateBearing(greenCenter, pt);
        const relativeBearing = (bearingToPt - bearingToCenter + 360) % 360;
        
        // Depth: Cosine component (Positive = Back, Negative = Front)
        const depth = distToPt * Math.cos(toRad(relativeBearing));
        // Width: Sine component (Positive = Right, Negative = Left)
        const width = distToPt * Math.sin(toRad(relativeBearing));

        if (depth < minDepth) { minDepth = depth; frontPt = pt; }
        if (depth > maxDepth) { maxDepth = depth; backPt = pt; }
        if (width < minWidth) { minWidth = width; leftPt = pt; }
        if (width > maxWidth) { maxWidth = width; rightPt = pt; }
    });

    return { front: frontPt, back: backPt, left: leftPt, right: rightPt };
};

export const generateClubsFromHdcp = (hdcp: number): ClubStats[] => {
    // 0 HDCP Baseline
    const baseline = [
        { name: "Driver", carry: 250, sideRate: 0.06, depthRate: 0.04 },
        { name: "3 Wood", carry: 230, sideRate: 0.06, depthRate: 0.04 },
        { name: "3 Hybrid", carry: 210, sideRate: 0.07, depthRate: 0.05 },
        { name: "4 Iron", carry: 195, sideRate: 0.07, depthRate: 0.05 },
        { name: "5 Iron", carry: 185, sideRate: 0.08, depthRate: 0.06 },
        { name: "6 Iron", carry: 175, sideRate: 0.08, depthRate: 0.06 },
        { name: "7 Iron", carry: 165, sideRate: 0.09, depthRate: 0.07 },
        { name: "8 Iron", carry: 155, sideRate: 0.09, depthRate: 0.07 },
        { name: "9 Iron", carry: 145, sideRate: 0.10, depthRate: 0.08 },
        { name: "PW", carry: 130, sideRate: 0.10, depthRate: 0.08 },
        { name: "AW", carry: 115, sideRate: 0.11, depthRate: 0.09 },
        { name: "SW", carry: 100, sideRate: 0.12, depthRate: 0.10 },
        { name: "LW", carry: 85, sideRate: 0.13, depthRate: 0.11 },
        { name: "Putter", carry: 30, sideRate: 0.03, depthRate: 0.03 },
    ];

    const distFactor = 1 - (Math.min(30, hdcp) * 0.008); 
    const scatterFactor = 1 + (Math.min(30, hdcp) * 0.08);

    return baseline.map(c => ({
        name: c.name,
        carry: Math.round(c.carry * distFactor),
        sideError: Math.round(c.carry * distFactor * c.sideRate * scatterFactor),
        depthError: Math.round(c.carry * distFactor * c.depthRate * scatterFactor)
    }));
};

export const calculateLayupStrategy = (
  distanceToGreen: number,
  bag: ClubStats[],
  shotNum: number
): { club1: ClubStats; club2: ClubStats; totalSideError: number } | null => {
  let validClubs1 = bag;
  if (shotNum > 1) {
      validClubs1 = bag.filter(c => !c.name.toLowerCase().includes('driver') && !c.name.toLowerCase().includes('putter'));
  }
  const validClubs2 = bag.filter(c => !c.name.toLowerCase().includes('driver'));
  let bestPair = null;
  let minRiskScore = Infinity;

  for (const c1 of validClubs1) {
      for (const c2 of validClubs2) {
          const totalCarry = c1.carry + c2.carry;
          if (totalCarry >= distanceToGreen - 5) {
             const totalSideError = c1.sideError + c2.sideError;
             if (totalSideError < minRiskScore) {
                 minRiskScore = totalSideError;
                 bestPair = { club1: c1, club2: c2, totalSideError };
             }
          }
      }
  }
  return bestPair;
};

export const getStrategyRecommendation = (
  distanceToGreen: number, 
  bag: ClubStats[], 
  useYards: boolean,
  shotNum: number = 1
): { mainAction: string; subAction?: string } => {
  const unit = useYards ? 'yd' : 'm';
  const val = useYards ? distanceToGreen * 1.09361 : distanceToGreen;
  const dist = Math.round(val);

  if (distanceToGreen < 5) return { mainAction: "Tap-In Range", subAction: "Excellent Shot!" };
  if (distanceToGreen < 20) return { mainAction: "Short Game", subAction: "Up & Down probability high" };
  if (distanceToGreen >= 80 && distanceToGreen <= 110) return { mainAction: "Perfect Layup", subAction: `Leaves full wedge (${dist}${unit})` };
  
  const maxCarry = bag[0].carry;
  if (shotNum > 1 && distanceToGreen > maxCarry) return { mainAction: "Layup Required", subAction: "Check recommended combo" };
  if (shotNum === 1 && distanceToGreen > 220) return { mainAction: "Safe Drive", subAction: "Focus on fairway hit" };
  return { mainAction: "Approach", subAction: `Leaves ${dist}${unit} to pin` };
};

/**
 * Uses Catmull-Rom Spline interpolation to generate a smooth closed path 
 * passing through all provided control points.
 */
export const getSmoothClosedPath = (points: LatLng[], tension: number = 0.5, numOfSegments: number = 10): LatLng[] => {
    if (points.length < 3) return points;

    const res: LatLng[] = [];
    const _pts = [...points];
    
    // To close the loop smoothly:
    // We treat the list as circular. 
    // Logic: for segment i, we need p[i-1], p[i], p[i+1], p[i+2]
    
    for (let i = 0; i < _pts.length; i++) {
        const p0 = _pts[(i - 1 + _pts.length) % _pts.length];
        const p1 = _pts[i];
        const p2 = _pts[(i + 1) % _pts.length];
        const p3 = _pts[(i + 2) % _pts.length];

        for (let t = 0; t < numOfSegments; t++) {
            const t1 = t / numOfSegments;
            const t2 = t1 * t1;
            const t3 = t2 * t1;

            // Catmull-Rom calculation
            // We do this for lat and lng separately
            
            const calc = (v0: number, v1: number, v2: number, v3: number) => {
                return 0.5 * (
                    (2 * v1) +
                    (-v0 + v2) * t1 +
                    (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 +
                    (-v0 + 3 * v1 - 3 * v2 + v3) * t3
                );
            };

            res.push({
                lat: calc(p0.lat, p1.lat, p2.lat, p3.lat),
                lng: calc(p0.lng, p1.lng, p2.lng, p3.lng)
            });
        }
    }
    
    // Add the first point at the end to ensure exact closure if render doesn't auto-close
    res.push(res[0]); 
    return res;
};
