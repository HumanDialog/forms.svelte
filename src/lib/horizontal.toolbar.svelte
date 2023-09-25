<script>
    import FaMoon from 'svelte-icons/fa/FaMoon.svelte'
    import FaSun from 'svelte-icons/fa/FaSun.svelte'
    import FaEllipsisH from 'svelte-icons/fa/FaEllipsisH.svelte'
    import FaTools from 'svelte-icons/fa/FaTools.svelte'
    import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import FaSignInAlt from 'svelte-icons/fa/FaSignInAlt.svelte'
    import FaSignOutAlt from 'svelte-icons/fa/FaSignOutAlt.svelte'

    import {
        dark_mode_store,
        toggle_sidebar,
        show_sidebar,
        hide_sidebar,
        tools_visible_store,
        bottom_bar_visible_store,
        right_sidebar_visible_store,
        main_sidebar_visible_store
    } from "./stores.js";
    import Icon from './components/icon.svelte';
    import {session, signin_href, signout_href} from '@humandialog/auth.svelte'
    

    export let app_config;
    
    let tabs = new Array();
    let config = null;
    let has_selection_details = false;
    let has_horizontal_tools = false;

    let show_sign_in_out_icons = false;
    let is_logged_in = false;
    let sign_in_href = '';
    let sign_out_href = '';

    $:
    {
        config = app_config.mainToolbar;
        has_selection_details = app_config.selectionDetails;
        has_horizontal_tools = app_config.horizontalTools;
        is_logged_in = $session.is_active;
        show_sign_in_out_icons = app_config.auth ? true : false;
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

</script>

<div class="mr-0 flex h-10">
    {#each tabs as tab}
        <button type="button" class=" w-16 h-full flex justify-center items-center  hover:bg-orange-500"
            class:text-blue-300={$main_sidebar_visible_store == tab.key}
            on:click={()=> (toggle_sidebar(tab.key))}>
            
            <Icon size={6} component={tab.icon}/>
        </button>
    {/each}
</div>

<div class="ml-auto flex h-10">
    
    {#if show_sign_in_out_icons }
        {#if !is_logged_in}
            <a  href={sign_in_href} class="h-full w-16 px-0 flex justify-center items-center   text-slate-100  hover:bg-orange-500">
                <Icon size={6} component={FaSignInAlt}/>
            </a> 
        {:else}
            <a  href={sign_out_href} class="h-full w-16 px-0 flex justify-center items-center   text-slate-100  hover:bg-orange-500">
                <Icon size={6} component={FaSignOutAlt}/>
            </a>
        {/if}
    {/if}

    {#if has_horizontal_tools}
        <button
            class="h-full w-16 px-0 flex justify-center items-center   text-slate-100  hover:bg-orange-500"
            class:text-blue-300={$tools_visible_store}
            on:click={()=> ($tools_visible_store = !$tools_visible_store)}
            >
            <Icon size={6} component={FaTools}/>
        </button>   
    {/if}

    {#if !config || config.darkMode }
        {#if $dark_mode_store == ''}
        <button
            class="h-full w-16 px-0 flex justify-center items-center   text-slate-100  hover:bg-orange-500"
            on:click={()=> ($dark_mode_store = 'dark')}
            >
            <div class="w-6 h-6">
                <FaMoon />
            </div>
        </button>
        {:else}
        <button
            class="h-full w-16 px-0 flex justify-center items-center   text-slate-100 hover:bg-orange-500"
            on:click={()=> ($dark_mode_store = '')}
            >
            <div class="w-6 h-6">
                <FaSun />
            </div>
        </button>
        {/if}
    {/if}

    {#if !config || config.gotoRoot }
        <a href='#/'>
        <button
            class="h-full w-16 px-0 flex justify-center items-center   text-slate-100  hover:bg-orange-500"
            >
            <Icon size={6} component={GoPrimitiveDot} />
        </button>
        </a>
    {/if}
   
    {#if has_selection_details}
        <button
            class="h-full w-16 px-0 flex justify-center items-center   text-slate-100  hover:bg-orange-500"
            class:text-blue-300={$bottom_bar_visible_store}
            on:click={()=> ($bottom_bar_visible_store = !$bottom_bar_visible_store)}
            >
            <div class="w-6 h-6">
                <FaEllipsisH />
            </div>
        </button>
    {/if}
   
</div>