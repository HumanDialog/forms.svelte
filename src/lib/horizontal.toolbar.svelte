<script>
    import {FaUsers, FaCog, FaSignInAlt, FaSignOutAlt, FaBars, FaToggleOn, FaToggleOff, FaLanguage} from 'svelte-icons/fa/'
    //import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import {showMenu} from '$lib/components/menu'
    import {push, pop, location} from 'svelte-spa-router'
    import {contextItemsStore, context_info_store, contextToolbarOperations, data_tick_store, leftHandedFAB} from './stores.js'
    //import Menu from '$lib/components/contextmenu.svelte'

    import {
        dark_mode_store,
        tools_visible_store,
        bottom_bar_visible_store,
        sidebar_left_pos,
		page_title,
		nav_titles,
        reloadWholeApp
    } from "./stores.js";
    import Icon from './components/icon.svelte';
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'

    import VerticalToolbar from '$lib/vertical.toolbar.svelte'
	import { isDeviceSmallerThan, navIsVisible, navGetKey, navToggle, navShow, navHide, navPrevVisibleKey } from './utils.js';
    import {setCurrentLanguage, getLanguages, i18n, getCurrentLanguage} from './i18n.js'

    export let appConfig = undefined;
    export let clearsContext = 'sel props'

    export let definedTabs = undefined
    export let mainToolbarConfig = undefined
    
    let config = null;
    let has_selection_details = false;
    let selection_details_caption = i18n({en: 'Properties', es: 'Propiedades', pl: 'Właściwości'});
    
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
            {
                if(appConfig.selectionDetails.captionFunc)
                    selection_details_caption = appConfig.selectionDetails.captionFunc()
                else if(appConfig.selectionDetails.caption)
                    selection_details_caption = appConfig.selectionDetails.caption

            }
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
        if(!navIsVisible())
            title = $page_title;
        else
        {
            const navKey = navGetKey()
            let nav_title = $nav_titles[navKey];
            if(nav_title != undefined)
                title = nav_title
            else
                title = ''
        }
    }

    function toggle_navigator(e)
    {
        if(tabs.length == 1)
        {
            $sidebar_left_pos = 0;
            navToggle(tabs[0])
        }
        else
        {
            $sidebar_left_pos = 40;

            if(!navIsVisible())
            {
                let navKey = navPrevVisibleKey()
                if(!navKey)
                    navKey = Object.keys(appConfig.sidebar)[0]
                
                navShow(navKey);
            }
            else
                navHide()
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
                    let caption = ''
                    if(o.captionFunc)
                        caption = o.captionFunc()
                    else if(o.caption)
                        caption = o.caption

                    options.push({
                                caption: caption,
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
                        caption: i18n( { en: 'Sign in', es: 'Iniciar sesión', pl: 'Zaloguj'}),
                        icon: FaSignInAlt,
                        action: (focused) => { push(sign_in_href) }
                    });
                }
                else
                {
                    options.push({
                        caption: i18n({en: 'Sign out', es: 'Cerrar sesión', pl: 'Wyloguj' }) ,
                        icon: FaSignOutAlt,
                        action: (focused) => { push(sign_out_href) }
                    });
                }

                options.push({separator: true})
                
        }

        if(!config || config.darkMode)
        {
            const capt = i18n({en: 'Dark mode', es: 'Modo oscuro', pl: 'Tryb ciemny'})
            if($dark_mode_store == '')
            {
                options.push( {
                        caption: capt,
                        icon: FaToggleOff,
                        action: (focused) => { $dark_mode_store = 'dark'; }
                    });
            }
            else
            {
                options.push( {
                        caption: capt,
                        icon: FaToggleOn,
                        action: (focused) => { $dark_mode_store = ''; }
                    });
            }
        }

        const langs = getLanguages()
        if(langs && langs.length > 1)
        {
            const langMenu = langs.map( l => ({
                caption: l.name,
                img: l.flag,
                action: (b) => {setCurrentLanguage(l); reloadWholeApp()},
                disabled: getCurrentLanguage() == l
            }))

            options.push( {
                caption: i18n({en: 'Language', es:'Idioma', pl:'Język'}),
                menu: langMenu,
                icon: FaLanguage
            })
        }

        if(config && config.operations)
        {
            options.push( {
                    caption: i18n({en:'Toolbar', es:'Barra de herramientas', pl:'Pasek narzędzi'}),
                    icon: $tools_visible_store ? FaToggleOn : FaToggleOff,
                    action: (focused) => { $tools_visible_store = !$tools_visible_store; }
                });
        }

         options.push({
                caption: i18n({en: 'Left-handed mode', es: 'Modo para zurdos', pl: 'Tryb dla leworęcznych'}),
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

{#if false && tabs.length > 1 &&  navIsVisible()}
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