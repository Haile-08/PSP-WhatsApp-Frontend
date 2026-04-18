/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wa: {
          'panel-header': '#f0f2f5',
          'panel':        '#ffffff',
          'chat-bg':      '#efeae2',
          'outgoing':     '#d9fdd3',
          'outgoing-tick':'#53bdeb',
          'incoming':     '#ffffff',
          'text-primary': '#111b21',
          'text-secondary':'#667781',
          'accent':       '#00a884',
          'accent-dark':  '#008069',
          'border':       '#d1d7db',
          'hover':        '#f5f6f6',
          'active':       '#f0f2f5',
          'search-bg':    '#f0f2f5',
          'icon':         '#54656f',
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
