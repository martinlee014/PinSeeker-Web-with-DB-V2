
import { ClubStats, GolfCourse } from './types';

export const DEFAULT_BAG: ClubStats[] = [
  { name: "Driver", carry: 230.0, sideError: 45.0, depthError: 25.0 },
  { name: "3 Wood", carry: 210.0, sideError: 35.0, depthError: 20.0 },
  { name: "3 Hybrid", carry: 190.0, sideError: 28.0, depthError: 18.0 },
  { name: "4 Iron", carry: 180.0, sideError: 24.0, depthError: 16.0 },
  { name: "5 Iron", carry: 170.0, sideError: 22.0, depthError: 15.0 },
  { name: "6 Iron", carry: 160.0, sideError: 20.0, depthError: 14.0 },
  { name: "7 Iron", carry: 150.0, sideError: 18.0, depthError: 12.0 },
  { name: "8 Iron", carry: 140.0, sideError: 15.0, depthError: 10.0 },
  { name: "9 Iron", carry: 130.0, sideError: 12.0, depthError: 8.0 },
  { name: "PW", carry: 115.0, sideError: 10.0, depthError: 7.0 },
  { name: "SW", carry: 95.0, sideError: 8.0, depthError: 5.0 },
  { name: "LW", carry: 80.0, sideError: 6.0, depthError: 4.0 },
  { name: "Putter", carry: 30.0, sideError: 1.0, depthError: 1.0 },
];

// Duvenhof Golf Club Data (Hardcoded built-in course)
export const DUVENHOF_COURSE: GolfCourse = {
  id: 'duvenhof_builtin',
  name: 'Duvenhof Golf Club',
  isCustom: false,
  holes: [
    { number: 1, par: 4, tee: { lat: 51.253031, lng: 6.610690 }, green: { lat: 51.256435, lng: 6.610896 } },
    { number: 2, par: 5, tee: { lat: 51.256303, lng: 6.611343 }, green: { lat: 51.253027, lng: 6.613838 } },
    { number: 3, par: 4, tee: { lat: 51.253934, lng: 6.613799 }, green: { lat: 51.256955, lng: 6.612713 } },
    { number: 4, par: 4, tee: { lat: 51.256230, lng: 6.613031 }, green: { lat: 51.253919, lng: 6.614703 } },
    { number: 5, par: 5, tee: { lat: 51.253513, lng: 6.613811 }, green: { lat: 51.257468, lng: 6.611944 } },
    { number: 6, par: 3, tee: { lat: 51.257525, lng: 6.611174 }, green: { lat: 51.256186, lng: 6.609659 } },
    { number: 7, par: 4, tee: { lat: 51.256339, lng: 6.608953 }, green: { lat: 51.259878, lng: 6.608542 } },
    { number: 8, par: 3, tee: { lat: 51.259387, lng: 6.608203 }, green: { lat: 51.259375, lng: 6.606481 } },
    { number: 9, par: 4, tee: { lat: 51.259009, lng: 6.607590 }, green: { lat: 51.256032, lng: 6.606043 } },
    { number: 10, par: 3, tee: { lat: 51.256458, lng: 6.606498 }, green: { lat: 51.257419, lng: 6.606892 } },
    { number: 11, par: 4, tee: { lat: 51.256823, lng: 6.607438 }, green: { lat: 51.259129, lng: 6.604306 } },
    { number: 12, par: 3, tee: { lat: 51.259052, lng: 6.603608 }, green: { lat: 51.260501, lng: 6.601357 } },
    { number: 13, par: 3, tee: { lat: 51.260501, lng: 6.601357 }, green: { lat: 51.259186, lng: 6.602760 } },
    { number: 14, par: 5, tee: { lat: 51.259147, lng: 6.601981 }, green: { lat: 51.255365, lng: 6.601745 } },
    { number: 15, par: 4, tee: { lat: 51.255140, lng: 6.603011 }, green: { lat: 51.258660, lng: 6.603824 } },
    { number: 16, par: 4, tee: { lat: 51.259015, lng: 6.603646 }, green: { lat: 51.256333, lng: 6.605922 } },
    { number: 17, par: 4, tee: { lat: 51.255532, lng: 6.606054 }, green: { lat: 51.256139, lng: 6.608421 } },
    { number: 18, par: 4, tee: { lat: 51.256022, lng: 6.608926 }, green: { lat: 51.252957, lng: 6.609506 } },
  ]
};

// Kept for backward compatibility if needed, but aliases to the object
export const DUVENHOF_HOLES = DUVENHOF_COURSE.holes;
