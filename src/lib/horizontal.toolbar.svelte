<script>
    import FaMoon from 'svelte-icons/fa/FaMoon.svelte'
    import FaSun from 'svelte-icons/fa/FaSun.svelte'
    import FaEllipsisH from 'svelte-icons/fa/FaEllipsisH.svelte'
    import FaCog from 'svelte-icons/fa/FaCog.svelte'
    import FaTools from 'svelte-icons/fa/FaTools.svelte'
    import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import FaSignInAlt from 'svelte-icons/fa/FaSignInAlt.svelte'
    import FaSignOutAlt from 'svelte-icons/fa/FaSignOutAlt.svelte'
    import FaBars from 'svelte-icons/fa/FaBars.svelte'
    import FaToggleOn from 'svelte-icons/fa/FaToggleOn.svelte'
    import FaToggleOff from 'svelte-icons/fa/FaToggleOff.svelte'
    import {showMenu} from '$lib/components/menu'
    import {push} from 'svelte-spa-router'
    import {contextItemsStore, context_info_store, contextToolbarOperations, data_tick_store} from './stores.js'
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

		nav_titles


    } from "./stores.js";
    import Icon from './components/icon.svelte';
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'

    import VerticalToolbar from '$lib/vertical.toolbar.svelte'
	import { isDeviceSmallerThan } from './utils.js';
    

    export let appConfig;
    export let clearsContext = 'sel props'
    
    let config = null;
    let has_selection_details = false;
    
    let show_sign_in_out_icons = false;
    let is_logged_in = false;
    let sign_in_href = '';
    let sign_out_href = '';

    let tabs = [];
    let icon;

    $:
    {
        config = appConfig.mainToolbar;
        has_selection_details = appConfig.selectionDetails;
        is_logged_in = $session.isActive;
        show_sign_in_out_icons = config.signin ? true : false;
        sign_in_href = $signInHRef;
        sign_out_href = $signOutHRef;

        tabs = Object.keys(appConfig.sidebar);
        if(tabs.length > 1)
            icon = FaBars;
        else    
        {
            let first_tab = appConfig.sidebar[tabs[0]];
            icon = first_tab.icon;
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
            push('/')
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

        if(has_selection_details)
        {
            options.push( {
                        caption: 'Properties',
                        icon: $bottom_bar_visible_store ? FaToggleOn : FaToggleOff,
                        action: (focused) => { $bottom_bar_visible_store = !$bottom_bar_visible_store }
                    });
        }
        
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
        <button class="w-12 sm:w-10 h-full flex justify-center items-center text-stone-300 hover:text-stone-100" on:click|stopPropagation={toggle_navigator}>
            <Icon class="w-8 sm:w-6 h-8 sm:h-6" component={icon}/>
        </button>
    </div>

    <div class="grow">
        
        <div class="block sm:hidden mt-4 sm:mt-3 uppercase text-sm text-center">{@html title}</div>
    </div>

    <div class="flex-none ml-auto flex h-12 sm:h-10">        
        <button
            class="h-full w-12 sm:w-10 px-0 flex justify-center items-center   text-stone-300 hover:text-stone-100"
            on:click|stopPropagation={show_options}>

            <Icon class="w-5 sm:w-4 h-5 sm:h-4" component={FaCog} />
        </button>
    </div>

</div>

{#if tabs.length > 1 &&  $main_sidebar_visible_store != "*"}
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