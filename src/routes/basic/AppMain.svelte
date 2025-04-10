<script>
	import {    isDeviceSmallerThan, 
                Spinner, 
                Page,
                main_sidebar_visible_store
    } from '$lib'
    import {push } from "svelte-spa-router";
    import Navigator from "./navigator.svelte";
    import NavigatorFolders from "./navigator.group.folders.svelte";
    import {FaPlus} from 'svelte-icons/fa/'
    import {session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
    import Landing from './landing/landing.svelte'
    import {onMount} from 'svelte'

    export let defaultPath = ''

    const UNKNOWN = 0;
    const REDIRECT = 1;
    const NAVIGATOR = 2;

    let whatToShow = UNKNOWN;

    $: update($main_sidebar_visible_store, $session)
    function update(...args)
    {
        if($session.isActive || $session.isUnauthorizedGuest)
        {
            if(isDeviceSmallerThan("sm"))
            {
                whatToShow = NAVIGATOR;
            }
            else 
            {
                whatToShow = REDIRECT;

                if($session.isUnauthorizedGuest)
                    push('/listboard');
                else
                    push('/mytasks');
            }
        }
        else
            whatToShow = UNKNOWN;
    }

    let navigator;

    function getPageOperations()
    {
        return {
            opver: 1,
            operations: [
                {
                    caption: 'View',
                    operations: [
                        {
                            icon: FaPlus,
                            action: (f) => navigator?.requestAdd(),
                            fab: 'M10'
                        }
                    ]
                }
            ]
        }
    }

    const currentNav = {}

    onMount( () => {
        console.log('AppMain onMount')
    })

</script>

<Authorized>
    {#if whatToShow == NAVIGATOR}
        <Page   toolbarOperations={ getPageOperations() }
                clearsContext='props sel'
                self={currentNav} 
                title="Octopus Basic">

            {#if $main_sidebar_visible_store == "Folders"}
                <NavigatorFolders   sidebar={false}
                                    bind:this={navigator} />
            {:else}
                <Navigator  sidebar={false}
                            bind:this={navigator}/>
            {/if}

        </Page>


    {:else}
        <Spinner delay={3000}/>
    {/if}
</Authorized>



