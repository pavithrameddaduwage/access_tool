/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css,scss}",
    // "./node_modules/flowbite/**/*.js"

  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto','Open Sans', 'sans-serif'],
      },
      height: {
        'screen-minus-100': 'calc(100vh - 100px)',
        'screen-minus-200': 'calc(100vh - 200px)',
      },
      colors:{
        // primary:'#f13a01',
        'horizon-blue':'#00bce1',
        'horizon-gray':'#D0D3D4',
        primary:'#055C9D',
        secondary:'#1B85B8',
        'light-blue': {
          50: '#f0faff',
          100: '#e0f7ff',
          200: '#b3ecff',
          300: '#80e1ff',
          400: '#4dd5ff',
          500: '#1acaff',
          600: '#00b2e6',
          700: '#008db4',
          800: '#006882',
          900: '#0c4a6e',
        },
      }
    },
  },
  plugins: [
    // require('flowbite/plugin')
  ],
}

