import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig( ({command, mode}) => {

	let finalApp = "tilos"	//"octopus" // 
	let buildConfig = {}

	let prod = false // true //

	switch(finalApp)
	{
	case 'octopus':
		buildConfig = {
			__APP_MODE__: '\'local\'',
			__OBJECTREEF_IO__: '\'objectreef.local:1996\'',
			__APP_ID__: '\'octopus\'', 
			__TENANT_ID__: '\'octopus\'',
			__SERVICE_PROTOCOL__: '\'http\'',
			__CLIENT_ID__: '\'SampleClientId\'',
			__CLIENT_SECRET__: '\'SampleClientSecret\'',
			__WEBSITE__: '\'http://localhost:5173\'',
			__GA_IDENTIFIER__: '\'\'',

			__OCTOPUS601_MODULES__:'\'tasklists,folders,messages\'',
			__OCTOPUS_MODULES__:'\'mypages,grouppages,folders,messages\'',
			__APP_TITLE__: '\'Octopus Basic\'',
			__APP_ICON__:'\'/ico/objectreeficon.png\'',
			__APP_DEFAULT_PAGE__: '\'/myday\'',
			__APP_DEFAULT_GUEST_PAGE__: '\'/listboard\'',
			__USERS_SET__: '\'octopus\'',
			__LANDING__: '\'octopus\'',
			__PRIVACY_PAGE__: '\'/privacy-policy\'',
			__TERMS_PAGE__:'\'/terms-and-conditions\''
		}
		break;

	case 'cluster':
		buildConfig = {
			__APP_MODE__: '\'remote\'',
			__OBJECTREEF_IO__: '\'objectreef.local:1997\'',
			__APP_ID__: '\'octopus_mfrjeljs\'', 
			__TENANT_ID__: '\'tid1\'',
			__SERVICE_PROTOCOL__: '\'https\'',
			__CLIENT_ID__: '\'SampleClientId\'',
			__CLIENT_SECRET__: '\'SampleClientSecret\'',
			__WEBSITE__: '\'http://localhost:5173\'',
			__GA_IDENTIFIER__: '\'\'',

			__OCTOPUS_MODULES__:'\'tasklists,folders,messages\'',
			__OCTOPUS604_MODULES__:'\'mypages,grouppages,folders,messages\'',
			__APP_TITLE__: '\'Octopus Basic\'',
			__APP_ICON__:'\'/ico/objectreeficon.png\'',
			__APP_DEFAULT_PAGE__: '\'/myday\'',
			__APP_DEFAULT_GUEST_PAGE__: '\'/listboard\'',
			__USERS_SET__: '\'octopus\'',
			__LANDING__: '\'octopus\'',
			__PRIVACY_PAGE__: '\'/privacy-policy\'',
			__TERMS_PAGE__:'\'/terms-and-conditions\''
		}
		break;

	case 'tilos':
		buildConfig = {
			__APP_MODE__:			'\'local\'',
			__OBJECTREEF_IO__:		'\'localhost:1996\'',
			__APP_ID__:				'\'octopus\'',
			__TENANT_ID__:			'\'octopus\'',
			__SERVICE_PROTOCOL__:	'\'http\'',
			__CLIENT_ID__:			'\'SampleClientId\'',
			__CLIENT_SECRET__:		'\'SampleClientSecret\'',
			__WEBSITE__:			'\'http://localhost:5173\'',
			__GA_IDENTIFIER__:		'\'\'',

			__OCTOPUS_MODULES__:'\'tilos\'',
			__APP_TITLE__: '\'TILOS Users Hub\'',
			__APP_ICON__:'\'/ico/TILOS-48.png\'',
			__APP_DEFAULT_PAGE__: '\'/feed/my\'',
			__APP_DEFAULT_GUEST_PAGE__: '\'/thome\'',
			__USERS_SET__: '\'octopus\'',
			__LANDING__: '\'tilos\'',
			__PRIVACY_PAGE__: '\'/doc/legal-privacy-policy\'',
			__TERMS_PAGE__:'\'/doc/legal/legal-terms-of-service-\''
		}
		break;
	}

	return {
		plugins: [sveltekit()],
		define: buildConfig
	}

})