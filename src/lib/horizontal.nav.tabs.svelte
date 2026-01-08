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
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'
    import {push } from 'svelte-spa-router';
	import { navGetKey, navHide, navIsVisible, navShow, navToggle, isDeviceSmallerThan } from './utils';
    import {setCurrentLanguage, getLanguages, i18n, getCurrentLanguage} from './i18n.js'
    import {showMenu, SHOW_MENU_RIGHT} from './components/menu'

    export let appConfig = undefined;
    export let clearsContext = 'sel props'

    export let definedTabs = undefined
    export let mainToolbarConfig = undefined

    let tabs = new Array();
    let config = null;
    let has_selection_details = false;
    let selection_detils_caption =  i18n({en: 'Properties', es: 'Propiedades', pl: 'Właściwości'});

    let show_sign_in_out_icons = false;
    let is_logged_in = false;
    let sign_in_href = '';
    let sign_out_href = '';

    $:  {
        if(appConfig)
        {
            config = appConfig.mainToolbar;
            has_selection_details = appConfig.selectionDetails;

            if(has_selection_details)
            {
                if(appConfig.selectionDetails.captionFunc)
                    selection_detils_caption = appConfig.selectionDetails.captionFunc()
                else if(appConfig.selectionDetails.caption)
                    selection_detils_caption = appConfig.selectionDetails.caption

            }
        }
        else
        {
            has_selection_details = false;
            config = mainToolbarConfig;
        }

        is_logged_in = $session.isActive;
        show_sign_in_out_icons = config.signin ? true : false;
        sign_in_href = $signInHRef;
        sign_out_href = $signOutHRef;

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
                                    mricon: o.mricon,
                                    action: o.action,
                                    menu: o.menu
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
                        mricon: 'log-in',
                        action: (focused) => { push(sign_in_href) }
                    });
                }
                else
                {
                    options.push({
                        caption: i18n({en: 'Sign out', es: 'Cerrar sesión', pl: 'Wyloguj' }) ,
                        icon: FaSignOutAlt,
                        mricon: 'log-out',
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
                        mricon: 'sun-moon',
                        action: (focused) => { $dark_mode_store = 'dark'; }
                    });
            }
            else
            {
                options.push( {
                        caption: capt,
                        icon: FaToggleOn,
                        mricon: 'sun-moon',
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
                mricon: 'languages',
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

        if(!isDeviceSmallerThan("sm"))
        {
            options.push({
                caption: i18n({en: 'Floating buttons', es: 'Botones flotantes', pl: 'Pływające przyciski'}),
                icon: $showFABAlways ? FaToggleOn : FaToggleOff,
                action: (f) => { $showFABAlways = !$showFABAlways; }
            })

            options.push({
                caption: i18n({en: 'Left-handed mode', es: 'Modo para zurdos', pl: 'Tryb dla leworęcznych'}),
                icon: $leftHandedFAB ? FaToggleOn : FaToggleOff,
                disabled: !$showFABAlways,
                action: (f) => { $leftHandedFAB = !$leftHandedFAB; }
            })
        }

        if(has_selection_details)
        {
            options.push( {
                        caption: selection_detils_caption,
                        icon: $bottom_bar_visible_store ? FaToggleOn : FaToggleOff,
                        action: (focused) => { $bottom_bar_visible_store = !$bottom_bar_visible_store }
                    });
        }

        //let anchor = new DOMPoint(rect.right, rect.top)
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

         <button
            class="w-16 h-full flex justify-center items-center"
                on:click|stopPropagation={show_options}>
                <Icon s="xl" component={FaCog} />
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