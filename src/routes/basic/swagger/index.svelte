<script>
	import { onMount } from 'svelte';
    import SwaggerUI from 'swagger-ui-dist/swagger-ui-es-bundle.js'
    import 'swagger-ui-dist/swagger-ui.css'
    import * as swaggerJson from './spec.json';

    let swaggerDOM;
    onMount( async () =>
    {
        const ui = SwaggerUI({
                dom_id: '#swagger-ui-container',
                spec: swaggerJson,
                oauth2RedirectUrl: `${__WEBSITE__}/swagger/oauth2-redirect.html`
            })

        ui.initOAuth({
            clientId: __CLIENT_ID__,
            clientSecret: __CLIENT_SECRET__,
            usePkceWithAuthorizationCodeGrant: true
        });
    })
    
</script>

<div id="swagger-ui-container" bind:this={swaggerDOM}>

</div>