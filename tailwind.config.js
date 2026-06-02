/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wa: {
          'panel-header': '#151815',
          'panel':        '#101210',
          'chat-bg':      '#0c0e0d',
          'outgoing':     '#14361f',
          'outgoing-tick':'#a3e635',
          'incoming':     '#1e221e',
          'text-primary': '#e9edec',
          'text-secondary':'#8a958f',
          'accent':       '#a3e635',
          'accent-dark':  '#84cc16',
          'border':       '#262b27',
          'hover':        '#1b1f1b',
          'active':       '#1e221e',
          'search-bg':    '#1e221e',
          'icon':         '#8a958f',
        },
      },
      fontFamily: {
        wa: ['"Segoe UI"', 'Helvetica', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'wa-base':      ['14.2px', { lineHeight: '19px' }],
        'wa-name':      ['17px',   { lineHeight: '22px' }],
        'wa-preview':   ['14px',   { lineHeight: '20px' }],
        'wa-timestamp': ['12px',   { lineHeight: '16px' }],
        'wa-bubble-ts': ['11px',   { lineHeight: '15px' }],
        'wa-chat-name': ['16px',   { lineHeight: '21px', fontWeight: '500' }],
        'wa-subtitle':  ['13px',   { lineHeight: '18px' }],
      },
      boxShadow: {
        'bubble': '0 1px 0.5px rgba(11,20,26,0.13)',
        'app':    '0 2px 8px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
