<script>
	import {session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
    import {Spinner} from '$lib'
    import AppView from './AppView.svelte';
    
    $: update($session)
    function update(...args)
    {
        
    }

    let has_landing_page = false
    let landing_component = null

    switch(__LANDING__)
    {
    case 'tilos':
        has_landing_page = true
        import('./tilos/landing.svelte').then((module) => { 
                                                            landing_component = module.default || module; 
                                                        })
        break;
    case 'octopus':
        has_landing_page = true
        import('./landing/landing.svelte').then((module) => { 
                                                            landing_component = module.default || module; 
                                                        })
        break;
    default:
        has_landing_page = false
        landing_component = null
        break;
        
    }

    

</script>

<Authorized>
    <AppView/>
</Authorized>

<NotAuthorized>
    {#if has_landing_page}
        {#if landing_component}
            <svelte:component this={landing_component} />
        {:else}
            <Spinner/> 
        {/if}
    {:else}
        <AppView/>
    {/if}
</NotAuthorized>


