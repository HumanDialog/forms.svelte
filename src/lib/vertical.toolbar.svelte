<script>
    import FaToggleOn from 'svelte-icons/fa/FaToggleOn.svelte'
    import FaToggleOff from 'svelte-icons/fa/FaToggleOff.svelte'
    import FaEllipsisH from 'svelte-icons/fa/FaEllipsisH.svelte'
    import FaTools from 'svelte-icons/fa/FaTools.svelte'
    import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import FaSignInAlt from 'svelte-icons/fa/FaSignInAlt.svelte'
    import FaSignOutAlt from 'svelte-icons/fa/FaSignOutAlt.svelte'
    import {show_menu} from '$lib/components/menu'
    //import Menu from '$lib/components/contextmenu.svelte'

    import {dark_mode_store, 
            toggle_sidebar, 
            show_sidebar,
            hide_sidebar,
            tools_visible_store,
            bottom_bar_visible_store, 
            right_sidebar_visible_store,
            main_sidebar_visible_store} from "./stores.js";     
    import Icon from './components/icon.svelte';
    import {session, signin_href, signout_href} from '@humandialog/auth.svelte'
	import { push } from 'svelte-spa-router';

    export let app_config;
    export let mobile=false;
    
    
    let tabs = new Array();
    let config = null;
    let has_selection_details = false;
    
    let show_sign_in_out_icons = false;
    let is_logged_in = false;
    let sign_in_href = '';
    let sign_out_href = '';

    $:{
        config = app_config.mainToolbar;
        has_selection_details = app_config.selectionDetails;
        is_logged_in = $session.is_active;
        show_sign_in_out_icons = config.signin ? true : false;
        sign_in_href = $signin_href;
        sign_out_href = $signout_href;

        tabs = new Array();

        Object.keys(app_config.sidebar).forEach( (key) =>    
            { 
                const ctab = app_config.sidebar[key];
                const can_show = (ctab.authorized && is_logged_in) || (!ctab.authorized)
                if(can_show)
                    tabs.push({key: key, icon: ctab.icon}); 
            });

        // there is no current visible sidebar
        if($main_sidebar_visible_store != '*')
        {
            if(tabs.every( (e) => e.key != $main_sidebar_visible_store))
            {
                if(tabs.length)
                    show_sidebar(tabs[0].key);
                else
                    hide_sidebar();
            }
        }
        
    }

    function on_tab_clicked(key)
    {
        if(!mobile)
            toggle_sidebar(key);
        else
            show_sidebar(key);
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
                options.push({
                            caption: o.caption,
                            icon: o.icon,
                            action: o.action
                        })
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
        
        let pt = new DOMPoint(rect.right, rect.top)
        show_menu(pt, options);    
    }
    
</script>


    <div class="px-0 w-10">
        {#each tabs as tab}
            {@const is_selected = $main_sidebar_visible_store == tab.key}
            <button
                class="h-16 px-0 flex justify-center items-center w-full text-slate-300 hover:text-slate-100"
                class:bg-orange-500={is_selected}
                on:click={()=> (on_tab_clicked(tab.key))}>
                
                <Icon size={6} component={tab.icon}/>
            </button>
        {/each}
    </div>

    {#if !mobile}
    
        <div class="mt-auto h-auto items-center w-full">
            
            <button
                class="h-16 px-0 flex justify-center items-center w-full text-slate-300 hover:text-slate-100"
                on:click={show_options}>

                <Icon size={6} component={FaEllipsisH} />
            </button>

        </div>
    {/if} <!-- !mobile -->


    <!--Menu bind:this={menu}/-->
