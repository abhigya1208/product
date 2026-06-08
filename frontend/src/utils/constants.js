// Fee structure by class
export const FEE_STRUCTURE = {
  'NUR': 250, 'LKG': 250, 'UKG': 250,
  '1': 300,  '2': 300,
  '3': 350,  '4': 350,  '5': 350,
  '6': 400,  '7': 400,
  '8': 450,
  '9': 500,
  '10': 600,
  '11': 0, // Handled as contact for details
  '12': 0, // Handled as contact for details
};

// All available classes
export const CLASSES = ['NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Classes that can have Section B
export const SECTION_B_CLASSES = ['4', '5', '6', '7', '8'];

// Teacher assignments per class
export const TEACHER_ASSIGNMENTS = {
  'NUR': 'KULSUM MAM', 'LKG': 'KULSUM MAM', 'UKG': 'KULSUM MAM',
  '1': 'KHUSHI MAM',   '2': 'KHUSHI MAM',   '3': 'KHUSHI MAM',
  '4': 'SHIVANI MAM',  '5': 'SHIVANI MAM',
  '6': 'VARTIKA MAM',  '7': 'VARTIKA MAM',  '8': 'VARTIKA MAM',
  '9': 'ABHIGYA SIR',  '10': 'ABHIGYA SIR',
  '11': 'CONTACT BRANCH', '12': 'CONTACT BRANCH',
};

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Clean up and resolve API URL resiliently
let resolvedApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (resolvedApiUrl && !resolvedApiUrl.endsWith('/api') && !resolvedApiUrl.endsWith('/api/')) {
  resolvedApiUrl = resolvedApiUrl.endsWith('/') ? `${resolvedApiUrl}api` : `${resolvedApiUrl}/api`;
}
export const API_URL = resolvedApiUrl;

// Extract origin for Socket fallback
let fallbackSocket = 'http://localhost:5000';
try {
  const urlObj = new URL(API_URL);
  fallbackSocket = urlObj.origin;
} catch (e) {
  // Ignore parsing errors
}

// Clean up and resolve Socket URL resiliently
let resolvedSocketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && resolvedSocketUrl.includes('localhost')) {
  resolvedSocketUrl = fallbackSocket;
}
export const SOCKET_URL = resolvedSocketUrl;
