import '@testing-library/jest-dom';

// TextEncoder / TextDecoder are used by React Router v7's CJS bundle but are
// not exposed in jsdom by default.
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Give api.js a stable base URL during tests
process.env.REACT_APP_API_URL = 'https://examnationwebapi.azurewebsites.net/api';

// window.matchMedia mock (required by Chart.js)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ResizeObserver mock (required by Recharts)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// MSW is incompatible with CRA's Babel config (react-scripts 5.0.1).
// All tests mock at the module level with jest.mock / jest.spyOn instead.
