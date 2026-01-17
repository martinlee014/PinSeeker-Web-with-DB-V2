

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

export const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway",
    "Oman",
    "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
];

// Duvenhof Golf Club Data (Hardcoded built-in course)
export const DUVENHOF_COURSE: GolfCourse = {
  id: 'duvenhof_builtin',
  name: 'Duvenhof Golf Club',
  country: 'Germany',
  isCustom: false,
  holes: [
    { number: 1, par: 4, tee: { lat: 51.253031, lng: 6.610690 }, green: { lat: 51.256435, lng: 6.610896 }, teeBoxes: [] },
    { number: 2, par: 5, tee: { lat: 51.256303, lng: 6.611343 }, green: { lat: 51.253027, lng: 6.613838 }, teeBoxes: [] },
    { number: 3, par: 4, tee: { lat: 51.253934, lng: 6.613799 }, green: { lat: 51.256955, lng: 6.612713 }, teeBoxes: [] },
    { number: 4, par: 4, tee: { lat: 51.256230, lng: 6.613031 }, green: { lat: 51.253919, lng: 6.614703 }, teeBoxes: [] },
    { number: 5, par: 5, tee: { lat: 51.253513, lng: 6.613811 }, green: { lat: 51.257468, lng: 6.611944 }, teeBoxes: [] },
    { number: 6, par: 3, tee: { lat: 51.257525, lng: 6.611174 }, green: { lat: 51.256186, lng: 6.609659 }, teeBoxes: [] },
    { number: 7, par: 4, tee: { lat: 51.256339, lng: 6.608953 }, green: { lat: 51.259878, lng: 6.608542 }, teeBoxes: [] },
    { number: 8, par: 3, tee: { lat: 51.259387, lng: 6.608203 }, green: { lat: 51.259375, lng: 6.606481 }, teeBoxes: [] },
    { number: 9, par: 4, tee: { lat: 51.259009, lng: 6.607590 }, green: { lat: 51.256032, lng: 6.606043 }, teeBoxes: [] },
    { number: 10, par: 3, tee: { lat: 51.256458, lng: 6.606498 }, green: { lat: 51.257419, lng: 6.606892 }, teeBoxes: [] },
    { number: 11, par: 4, tee: { lat: 51.256823, lng: 6.607438 }, green: { lat: 51.259129, lng: 6.604306 }, teeBoxes: [] },
    { number: 12, par: 4, tee: { lat: 51.259052, lng: 6.603608 }, green: { lat: 51.260501, lng: 6.601357 }, teeBoxes: [] },
    { number: 13, par: 3, tee: { lat: 51.260116, lng: 6.601089 }, green: { lat: 51.259186, lng: 6.602760 }, teeBoxes: [] },
    { number: 14, par: 5, tee: { lat: 51.259147, lng: 6.601981 }, green: { lat: 51.255365, lng: 6.601745 }, teeBoxes: [] },
    { number: 15, par: 4, tee: { lat: 51.255140, lng: 6.603011 }, green: { lat: 51.258660, lng: 6.603824 }, teeBoxes: [] },
    { number: 16, par: 4, tee: { lat: 51.259015, lng: 6.603646 }, green: { lat: 51.256333, lng: 6.605922 }, teeBoxes: [] },
    { number: 17, par: 4, tee: { lat: 51.255532, lng: 6.606054 }, green: { lat: 51.256139, lng: 6.608421 }, teeBoxes: [] },
    { number: 18, par: 4, tee: { lat: 51.256022, lng: 6.608926 }, green: { lat: 51.252957, lng: 6.609506 }, teeBoxes: [] },
  ]
};

export const DUVENHOF_HOLES = DUVENHOF_COURSE.holes;
