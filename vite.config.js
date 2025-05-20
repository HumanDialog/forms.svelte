import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig( ({command, mode}) => {

	let finalApp = "octopus" // "tilos"	// 
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
		}
		break;

	case 'tilos':
		buildConfig = {
			__APP_MODE__:			prod ? 	'\'remote\'' 							: 	'\'local\'',
			__OBJECTREEF_IO__:		prod ? 	'\'objectreef.io\'' 					: 	'\'localhost:1996\'',
			__APP_ID__:				prod ? 	'\'octopus\'' 							: 	'\'octopus\'',
			__TENANT_ID__:			prod ? 	'\'octopus\'' 							: 	'\'octopus\'',
			__SERVICE_PROTOCOL__:	prod ? 	'\'https\'' 							: 	'\'http\'',
			__CLIENT_ID__:			prod ? 	'\'forms.svelte\'' 						: 	'\'SampleClientId\'',
			__CLIENT_SECRET__:		prod ? 	'\'forms.svelte\'' 						: 	'\'SampleClientSecret\'',
			__WEBSITE__:			prod ? 	'\'http://localhost:5173/basic\'' 		: 	'\'http://localhost:5174/basic\'',
			__GA_IDENTIFIER__:		prod ? 	'\'\'' 									: 	'\'\'',
			
			__OCTOPUS_MODULES__:'\'tilos,messages,tasklists\'',
			__APP_TITLE__: '\'Tilos\'',
			__APP_ICON__:'\'/ico/TILOS-48.png\'',
			__APP_DEFAULT_PAGE__: '\'/thome\'',
			__APP_DEFAULT_GUEST_PAGE__: '\'/thome\'',
			__USERS_SET__: '\'tilos\'',
			__LANDING__: '\'tilos\'',
		}
		break;
	}

	return {
		plugins: [sveltekit()],
		define: buildConfig
	}
   
})