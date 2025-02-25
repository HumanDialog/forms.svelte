<script>
	import {    isDeviceSmallerThan, 
                Spinner, 
                Page,
                VerticalToolbar,
				main_sidebar_visible_store

    } from '$lib'
    import {push } from "svelte-spa-router";
    import Navigator from "./navigator.svelte";
    import NavigatorFolders from "./navigator.group.folders.svelte";
    import {FaPlus} from 'svelte-icons/fa/'
    import {session} from '@humandialog/auth.svelte'

    export let defaultPath = ''

    const UNKNOWN = 0;
    const REDIRECT = 1;
    const NAVIGATOR = 2;

    let whatToShow = UNKNOWN;

    $: update($main_sidebar_visible_store)
    function update(...args)
    {
        if(isDeviceSmallerThan("sm"))
        {
            whatToShow = NAVIGATOR;
        }
        else 
        {
            whatToShow = REDIRECT;

            if($session.isActive)
                push('/mytasks');
            else
                push('/listboard');
        }
    }

    let navigator;
    function getPageOperations()
    {
        return [
            {
                icon: FaPlus,
                action: (f) => navigator?.requestAddList()
            }
        ]
    }

    const currentNav = {}

</script>


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

