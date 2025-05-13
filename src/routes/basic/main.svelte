<script>
	import {session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
    import {Spinner} from '$lib'
    import AppView from './AppView.svelte';
    
    $: update($session)
    function update(...args)
    {
        
    }

    let landingComponent = null
    switch(__LANDING__)
    {
    case 'tilos':
        import('./tilos/landing.svelte').then((module) => { 
                                                            landingComponent = module.default || module; 
                                                        })
        break;
    default:
        import('./landing/landing.svelte').then((module) => { 
                                                            landingComponent = module.default || module; 
                                                        })
        break;
    }

    

</script>

<Authorized>
    <AppView/>
</Authorized>

<NotAuthorized>
    {#if landingComponent}
        <svelte:component this={landingComponent} />
    {:else}
        <Spinner/> 
    {/if}
</NotAuthorized>


