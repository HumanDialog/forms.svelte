import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig( ({command, mode}) => {

	let finalApp = "tilos"	// "octopus" //
	let buildConfig = {}

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
			__APP_MODE__: '\'local\'',
			__OBJECTREEF_IO__: '\'localhost:1996\'',
			__APP_ID__: '\'octopus\'',
			__TENANT_ID__: '\'octopus\'',
			__SERVICE_PROTOCOL__: '\'http\'',
			__CLIENT_ID__: '\'SampleClientId\'',
			__CLIENT_SECRET__: '\'SampleClientSecret\'',
			__WEBSITE__: '\'http://localhost:5174\'',
			__GA_IDENTIFIER__: '\'\'',
			
			__OCTOPUS_MODULES__:'\'tilos,messages,tasklists\'',
			__APP_TITLE__: '\'Tilos\'',
			__APP_ICON__:'\'/ico/TILOS-48.png\'',
			__APP_DEFAULT_PAGE__: '\'/tiloshome\'',
			__APP_DEFAULT_GUEST_PAGE__: '\'/tiloshome\'',
			__USERS_SET__: '\'tilos\'',
			__LANDING__: '\'tilos\'',
		}
		break;
	}

	if(mode == 'development')
	{
		return {
		plugins: [sveltekit()],
		define: buildConfig
		}
  }
  else if(mode == 'production')
  {
    return {
      plugins: [sveltekit()],
     
    }
  }
  else
  {
    console.error('unknown vite mode: ', mode);
    return {
      plugins: [sveltekit()]
    }
  } 
})