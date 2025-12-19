<script>
    import {contextItemsStore,
            context_info_store,
            contextToolbarOperations,
            data_tick_store,
            navKey
        } from "./stores.js";     
    import Icon from './components/icon.svelte';
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'
	import { navGetKey, navHide, navIsVisible, navShow, navToggle } from './utils';
    
    export let appConfig = undefined;
    export let clearsContext = 'sel props'
    
    export let definedTabs = undefined
    export let mainToolbarConfig = undefined
    
    let tabs = new Array();
    let config = null;
    
    
    let is_logged_in = false;
    
    $:  {
        if(appConfig)
        {
            config = appConfig.mainToolbar;
        }
        else
        {
            config = mainToolbarConfig;
        }

        is_logged_in = $session.isActive;
        
        tabs = new Array();

        if(definedTabs && Array.isArray(definedTabs) && definedTabs.length > 0)
        {
            tabs = [...definedTabs]
        }
        else
        {
            Object.keys(appConfig.sidebar).forEach( (key) =>    
                { 
                    const ctab = appConfig.sidebar[key];
                    const can_show = (ctab.authorized && is_logged_in) || (!ctab.authorized)
                    if(can_show)
                    {
                        const tab = {
                            key: key,
                            icon: ctab.icon,
                            onclick: (e) => on_navigator_tab_clicked(e, key),
                            mountObserver: ctab.mountObserver,
                            badgeObtainerAsync: ctab.badgeObtainerAsync,
                            badgeObtainer: ctab.badgeObtainer
                        }

                        tabs.push(tab); 
                    }
                });

            // there is no current visible sidebar
            if(navIsVisible())
            {
                const selectedNav = navGetKey()
                if(tabs.every( (e) => e.key != selectedNav))
                {
                    if(tabs.length)
                        navShow(tabs[0].key);
                    else
                        navHide();
                }
            }
        }
    }

    function on_navigator_tab_clicked(e, key)
    {
        e.stopPropagation();    
        navToggle(key);
    }
    

    function clearSelection()
    {
        if (!clearsContext) return;

		let contexts = clearsContext.split(' ');
		contexts.forEach((c) => {
			$contextItemsStore[c] = null;
			$context_info_store[c] = '';
		});

		//e.stopPropagation();

		$contextToolbarOperations = [];
		$data_tick_store = $data_tick_store + 1;
    }

    function mountNavigator(node, tab)
    {
        if(!tab.mountObserver)
            return;

        const onDestroy = tab.mountObserver(rerenderTabs)

        return {
            destroy() {
                if(onDestroy)
                    onDestroy()
            }
        }
    }

    function rerenderTabs()
    {
        tabs = [...tabs]
    }
    
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<section class="no-print w-full" on:click={clearSelection}>
    <div class="left-0 flex justify-around h-12">
        {#each tabs as tab}
            {@const isSelected = $navKey == tab.key}
            <button
                class="w-16 h-full flex justify-center items-center text-stone-300 hover:text-stone-100 relative"
                class:bg-orange-500={isSelected}
                on:click={tab.onclick}
                use:mountNavigator={tab}>
                
                <Icon s="xl" component={tab.icon}/>

                {#if !isSelected}
                    {#if tab.badgeObtainer}
                        {@const badge=tab.badgeObtainer()}
                        {#if badge > 0}
                            {#if badge > 9}
                                9+
                            {:else}
                                {badge}
                            {/if}
                        {/if}
                    {:else if tab.badgeObtainerAsync}
                        {#await tab.badgeObtainerAsync() then badge}
                            {#if badge > 0}
                                <div class="absolute 
                                            inline-flex items-center justify-center 
                                            w-5 h-5 
                                            text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full bottom-2 end-0 dark:border-gray-900">
                                    {#if badge > 9}
                                        9+
                                    {:else}
                                        {badge}
                                    {/if}
                                </div>
                            {/if}
                        {/await}
                    {/if}
                {/if}

            </button>
        {/each}
    </div>

    
</section>

    <!--Menu bind:this={menu}/-->



<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>