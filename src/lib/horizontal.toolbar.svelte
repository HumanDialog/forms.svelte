<script>
    import FaMoon from 'svelte-icons/fa/FaMoon.svelte'
    import FaSun from 'svelte-icons/fa/FaSun.svelte'
    import FaEllipsisH from 'svelte-icons/fa/FaEllipsisH.svelte'
    import FaTools from 'svelte-icons/fa/FaTools.svelte'
    import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import FaSignInAlt from 'svelte-icons/fa/FaSignInAlt.svelte'
    import FaSignOutAlt from 'svelte-icons/fa/FaSignOutAlt.svelte'
    import FaBars from 'svelte-icons/fa/FaBars.svelte'
    import FaToggleOn from 'svelte-icons/fa/FaToggleOn.svelte'
    import FaToggleOff from 'svelte-icons/fa/FaToggleOff.svelte'
    import {show_menu} from '$lib/components/menu'
    //import Menu from '$lib/components/contextmenu.svelte'

    import {
        dark_mode_store,
        toggle_sidebar,
        show_sidebar,
        hide_sidebar,
        tools_visible_store,
        bottom_bar_visible_store,
        previously_visible_sidebar,
        main_sidebar_visible_store
    } from "./stores.js";
    import Icon from './components/icon.svelte';
    import {session, signin_href, signout_href} from '@humandialog/auth.svelte'

    import VerticalToolbar from '$lib/vertical.toolbar.svelte'
    

    export let app_config;
    
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
        config = app_config.mainToolbar;
        has_selection_details = app_config.selectionDetails;
        is_logged_in = $session.is_active;
        show_sign_in_out_icons = config.signin ? true : false;
        sign_in_href = $signin_href;
        sign_out_href = $signout_href;

        tabs = Object.keys(app_config.sidebar);
        if(tabs.length > 1)
            icon = FaBars;
        else    
        {
            let first_tab = app_config.sidebar[tabs[0]];
            icon = first_tab.icon;
        }
    }

    function toggle_navigator(e)
    {
        if(tabs.length == 1)
        {
            toggle_sidebar(tabs[0]);
        }
        else
        {
            let sidebar = $main_sidebar_visible_store;
            if(sidebar == "*")
            {
                if((!previously_visible_sidebar) || previously_visible_sidebar === '*')
                    sidebar = Object.keys(app_config.sidebar)[0];
                else
                    sidebar = previously_visible_sidebar;
            }

            toggle_sidebar(sidebar)
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
        show_menu(pt, options);    
    }

</script>

<div class="mr-0 flex h-10">
    <button class="w-10 h-full flex justify-center items-center text-slate-300 hover:text-slate-100" on:click={toggle_navigator}>
        <Icon size={6} component={icon}/>
    </button>
</div>

<div class="ml-auto flex h-10">
            
    <button
        class="h-full w-16 px-0 flex justify-center items-center   text-slate-300 hover:text-slate-100"
        on:click={show_options}>

        <Icon size={6} component={FaEllipsisH} />
    </button>

    
   
</div>

{#if tabs.length > 1 &&  $main_sidebar_visible_store != "*"}
    <div  class="block fixed left-0 top-[40px] w-[40px] h-screen z-20 inset-0   overflow-hidden">
        <div class="sticky top-0 flex h-full w-10 bg-slate-900 flex-col items-center text-gray-100 shadow">
            <VerticalToolbar {app_config} mobile={true}/>
        </div>    
    </div>    
{/if}

<!--Menu bind:this={menu}/-->