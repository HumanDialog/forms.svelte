const disabledCss = {
	'code::before': false,
	'code::after': false,
}


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
			typography: {
				DEFAULT: { css: disabledCss },
				sm: { css: disabledCss },
				lg: { css: disabledCss },
				xl: { css: disabledCss },
				'2xl': { css: disabledCss },
			},
		},
  },
  plugins: [
    require('@tailwindcss/typography'),  
  ],
  darkMode: 'class'
}

