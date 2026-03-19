<script>
    import {FaUsers, FaCog, FaToggleOn, FaToggleOff, FaSignInAlt, FaSignOutAlt, FaPlus, FaLanguage} from 'svelte-icons/fa/'
    import {contextItemsStore,
            context_info_store,
            contextToolbarOperations,
            data_tick_store, showFABAlways, leftHandedFAB,
            navKey, tools_visible_store, bottom_bar_visible_store,
            dark_mode_store, reloadWholeApp
        } from "./stores.js";
    import Icon from './components/icon.svelte';
    import Ricon from './components/r.icon.svelte'
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'
    import {push } from 'svelte-spa-router';
	import { navGetKey, navHide, navIsVisible, navShow, navToggle, isDeviceSmallerThan } from './utils';
    import {setCurrentLanguage, getLanguages, i18n, getCurrentLanguage} from './i18n.js'
    import {showMenu, SHOW_MENU_RIGHT} from './components/menu'
    import {get_settings_menu} from './settings_menu.js'

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
                            mricon: ctab.mricon,
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

    function show_options(e)
    {

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect();
        const options = get_settings_menu(appConfig, mainToolbarConfig)
        if(options && options.length > 0)
            showMenu(rect, options, SHOW_MENU_RIGHT);
    }


</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<section class="no-print w-full" on:click={clearSelection}>
    <div class="left-0 flex justify-around h-12">
        {#each tabs as tab}
            {@const isSelected = $navKey == tab.key}
            <button
                class="w-16 h-full flex justify-center items-center relative"
                class:bg-orange-500={isSelected}
                on:click={tab.onclick}
                use:mountNavigator={tab}>

                {#if tab.mricon}
                    <Ricon icon={tab.mricon} />
                {:else}
                    <Icon s="xl" component={tab.icon}/>
                {/if}

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

         <button
            class="w-16 h-full flex justify-center items-center"
                on:click|stopPropagation={show_options}>
                <Ricon icon='settings' />
        </button>

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