<script>
    import {FaUsers, FaCog, FaSignInAlt, FaSignOutAlt, FaBars, FaToggleOn, FaToggleOff} from 'svelte-icons/fa/'
    //import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import {showMenu} from '$lib/components/menu'
    import {push, pop, location} from 'svelte-spa-router'
    import {contextItemsStore, context_info_store, contextToolbarOperations, data_tick_store, leftHandedFAB} from './stores.js'
    //import Menu from '$lib/components/contextmenu.svelte'

    import {
        dark_mode_store,
        toggle_sidebar,
        show_sidebar,
        hide_sidebar,
        tools_visible_store,
        bottom_bar_visible_store,
        previously_visible_sidebar,
        main_sidebar_visible_store,
        sidebar_left_pos,
		page_title,
		nav_titles,
        reloadWholeApp
    } from "./stores.js";
    import Icon from './components/icon.svelte';
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'

    import VerticalToolbar from '$lib/vertical.toolbar.svelte'
	import { isDeviceSmallerThan, isOnNavigationPage, pushNavigationPage, popNavigationPage } from './utils.js';
    

    export let appConfig = undefined;
    export let clearsContext = 'sel props'

    export let definedTabs = undefined
    export let mainToolbarConfig = undefined
    
    let config = null;
    let has_selection_details = false;
    let selection_details_caption = 'Properties'
    
    let show_sign_in_out_icons = false;
    let is_logged_in = false;
    let sign_in_href = '';
    let sign_out_href = '';
    let user_is_in_multiple_groups = false;

    let tabs = [];
    let icon;

    $:
    {
        if(appConfig)
        {
            config = appConfig.mainToolbar;
            has_selection_details = appConfig.selectionDetails;
            if(has_selection_details)
                selection_details_caption = appConfig.selectionDetails.caption ?? 'Properties';
        }
        else
        {
            config = mainToolbarConfig
            has_selection_details = false
        }

        is_logged_in = $session.isActive;
        show_sign_in_out_icons = config.signin ? true : false;
        sign_in_href = $signInHRef;
        sign_out_href = $signOutHRef;
        //user_is_in_multiple_groups = $session.tenants.length > 1

        if(definedTabs && Array.isArray(definedTabs) && definedTabs.length > 0)
        {
            
        }
        else
        {
            tabs = Object.keys(appConfig.sidebar);
            if(tabs.length > 1)
                icon = FaBars;
            else    
            {
                let first_tab = appConfig.sidebar[tabs[0]];
                icon = first_tab.icon;
            }
        }
    }

    let title = ''
    $:{
        if($main_sidebar_visible_store == '*')
            title = $page_title;
        else
        {
            let nav_title = $nav_titles[$main_sidebar_visible_store];
            if(nav_title != undefined)
                title = nav_title
            else
                title = ''
        }
    }

    function toggle_navigator(e)
    {
        if(isDeviceSmallerThan('sm'))
        {
            if(isOnNavigationPage())
            {
                popNavigationPage();
            }
            else
            {
                if(tabs.length == 1)
                {
                    $sidebar_left_pos = 0;
                    show_sidebar(tabs[0]);
                }
                else
                {
                    let sidebar = $main_sidebar_visible_store;
                    if(sidebar == "*")
                    {
                        if((!previously_visible_sidebar) || previously_visible_sidebar === '*')
                            sidebar = Object.keys(appConfig.sidebar)[0];
                        else
                            sidebar = previously_visible_sidebar;
                    }

                    $sidebar_left_pos = 40;
                    show_sidebar(sidebar)
                }

                pushNavigationPage();
            }
        }
        else
        {

            if(tabs.length == 1)
            {
                $sidebar_left_pos = 0;
                toggle_sidebar(tabs[0]);
            }
            else
            {
                let sidebar = $main_sidebar_visible_store;
                if(sidebar == "*")
                {
                    if((!previously_visible_sidebar) || previously_visible_sidebar === '*')
                        sidebar = Object.keys(appConfig.sidebar)[0];
                    else
                        sidebar = previously_visible_sidebar;
                }

                $sidebar_left_pos = 40;
                toggle_sidebar(sidebar)
            }
        }
    }

    function show_options(e)
    {
        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect();
        let options = [];

        if(config.customOperations && Array.isArray(config.customOperations) && config.customOperations.length > 0)
        {
            config.customOperations.forEach( o => {
                let add = true;
                if(o.condition)
                    add = o.condition();

                if(add)
                {
                    options.push({
                                caption: o.caption,
                                icon: o.icon,
                                action: o.action
                            })
                }
            })
        }

        if(show_sign_in_out_icons)
        {
                if(!is_logged_in)
                {
                    options.push({
                        caption: 'Sign in',
                        icon: FaSignInAlt,
                        action: (focused) => { push(sign_in_href) }
                    });
                }
                else
                {
                    options.push({
                        caption: 'Sign out',
                        icon: FaSignOutAlt,
                        action: (focused) => { push(sign_out_href) }
                    });
                }

                options.push({separator: true})
                
        }

        if(!config || config.darkMode)
        {
            if($dark_mode_store == '')
            {
                options.push( {
                        caption: 'Dark mode',
                        icon: FaToggleOff,
                        action: (focused) => { $dark_mode_store = 'dark'; }
                    });
            }
            else
            {
                options.push( {
                        caption: 'Dark mode',
                        icon: FaToggleOn,
                        action: (focused) => { $dark_mode_store = ''; }
                    });
            }
        }

        if(config && config.operations)
        {
            options.push( {
                    caption: 'Toolbar',
                    icon: $tools_visible_store ? FaToggleOn : FaToggleOff,
                    action: (focused) => { $tools_visible_store = !$tools_visible_store; }
                });
        }

         options.push({
                caption: 'Left-handed floating actions',
                icon: $leftHandedFAB ? FaToggleOn : FaToggleOff,
                action: (f) => { $leftHandedFAB = !$leftHandedFAB; }
            })

        if(has_selection_details)
        {
            options.push( {
                        caption: selection_details_caption,
                        icon: $bottom_bar_visible_store ? FaToggleOn : FaToggleOff,
                        action: (focused) => { $bottom_bar_visible_store = !$bottom_bar_visible_store }
                    });
        }
        
        let pt = new DOMPoint(rect.left, rect.bottom)
        showMenu(pt, options);    
    }

    function show_groups(e)
    {
        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect();
        let options = [];

        $session.tenants.forEach(tInfo =>
            options.push({
                caption: tInfo.name,
                icon: FaUsers,
                disabled: tInfo.id == $session.tid,
                action: (f) => {
                    $session.setCurrentTenantAPI(tInfo.url, tInfo.id)
                    push('/')
                    reloadWholeApp();
                }
            })
        )

        
        let pt = new DOMPoint(rect.left, rect.bottom)
        showMenu(pt, options);    
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

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="no-print flex flex-row w-full" on:click={clearSelection}>
    <div class="flex-none left-0 flex h-12 sm:h-10">
        {#if definedTabs && definedTabs.length > 0}
            {#each definedTabs as tab}
                <button class="w-12 sm:w-10 h-full flex justify-center items-center text-stone-300 hover:text-stone-100" on:click={tab.onclick}>
                    <Icon s="xl" component={tab.icon}/>
                </button>    
            {/each}
        {:else}
            <button class="w-12 sm:w-10 h-full flex justify-center items-center text-stone-300 hover:text-stone-100" on:click|stopPropagation={toggle_navigator}>
                <Icon s="xl" component={icon}/>
            </button>
        {/if}
    </div>

    <div class="grow">
        
        <div class="block sm:hidden mt-4 sm:mt-3 uppercase text-sm text-center">{@html title}</div>
    </div>

    <div class="flex-none ml-auto flex h-12 sm:h-10">   
        {#if user_is_in_multiple_groups}
            <button class="h-full w-12 sm:w-10 px-0 flex justify-center items-center   text-stone-300 hover:text-stone-100"
                    on:click|stopPropagation={show_groups}>
                <Icon s="xl" component={FaUsers} />
            </button>
        {/if}

        <button
            class="h-full w-12 sm:w-10 px-0 flex justify-center items-center   text-stone-300 hover:text-stone-100"
            on:click|stopPropagation={show_options}>

            <Icon s="xl" component={FaCog} />
        </button>
    </div>

</div>

{#if false && tabs.length > 1 &&  $main_sidebar_visible_store != "*"}
    <div  class="no-print flex-none block fixed left-0 top-[40px] w-[40px] h-screen z-20 inset-0   overflow-hidden">
        <div class="sticky top-0 flex h-full w-10 bg-stone-900 flex-col items-center text-stone-100 shadow">
            <VerticalToolbar {appConfig} mobile={true}/>
        </div>    
    </div>    
{/if}

<!--Menu bind:this={menu}/-->

<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>