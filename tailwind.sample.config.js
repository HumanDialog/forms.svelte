const disabledCss = {
	'code::before': false,
	'code::after': false,
}

const round = (num) =>
  num
    .toFixed(7)
    .replace(/(\.[0-9]+?)0+$/, '$1')
    .replace(/\.0$/, '')
const rem = (px) => `${round(px / 16)}rem`
const em = (px, base) => `${round(px / base)}em`


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}',
  			'./node_modules/@humandialog/forms.svelte/**/*.{html,js,svelte,ts}',
			'./node_modules/@humandialog/auth.svelte/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
			typography: {
				DEFAULT: 
				{ 
					css: 
					{
						'code::before': false,
						'code::after': false,
					} 
				},
				sm: 
				{ 
					css:
					{
						'code::before': false,
						'code::after': false,
					} 
				},
				base:
				{
					css:
					{
						'code::before': false,
						'code::after': false,
						
					}
				},
				lg: 
				{ 
					css:
					{
						'code::before': false,
						'code::after': false,
					} 
				},
				xl: 
				{ 
					css:
					{
						'code::before': false,
						'code::after': false,
					} 
				},
				'2xl': 
				{ 
					css:
					{
						'code::before': false,
						'code::after': false,
					}
				},
			},
		},
  },
  plugins: [
    require('@tailwindcss/typography'),  
  ],
  darkMode: 'class'
}

