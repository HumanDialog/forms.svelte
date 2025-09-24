import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig( ({command, mode}) => {

	let finalApp = "octopus" 
	let buildConfig = {}

	let prod = false // true //

	switch(finalApp)
	{
	case 'octopus':
		buildConfig = {
			__APP_MODE__: '\'local\'',
			__OBJECTREEF_IO__: '\'localhost:1996\'',
			__APP_ID__: '\'octopus\'',
			__TENANT_ID__: '\'octopus\'',
			__SERVICE_PROTOCOL__: '\'http\'',
			__CLIENT_ID__: '\'SampleClientId\'',
			__CLIENT_SECRET__: '\'SampleClientSecret\'',
			__WEBSITE__: '\'http://localhost:5174\'',
			__GA_IDENTIFIER__: '\'\'',

			__OCTOPUS_MODULES__:'\'tasklists,folders,messages\'',
			__APP_TITLE__: '\'Octopus Basic\'',
			__APP_ICON__:'\'/ico/objectreeficon.png\'',
			__APP_DEFAULT_PAGE__: '\'/mytasks\'',
			__APP_DEFAULT_GUEST_PAGE__: '\'/listboard\'',
			__USERS_SET__: '\'octopus\'',
			__LANDING__: '\'octopus\'',
			__PRIVACY_PAGE__: '\'/privacy-policy\'',
			__TERMS_PAGE__:'\'/terms-and-conditions\''
		}
		break;
	}

	return {
		plugins: [sveltekit()],
		define: buildConfig
	}

})