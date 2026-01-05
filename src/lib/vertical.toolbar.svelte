<script>
    import {FaUsers, FaCog, FaToggleOn, FaToggleOff, FaSignInAlt, FaSignOutAlt, FaPlus, FaLanguage} from 'svelte-icons/fa/'
    //import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import {showMenu, SHOW_MENU_RIGHT} from '$lib/components/menu'
    import {reef} from '@humandialog/auth.svelte'
    import Modal from './modal.svelte'
    import Input from './components/inputbox.ltop.svelte'
    //import Menu from '$lib/components/contextmenu.svelte'

    import {dark_mode_store,
            tools_visible_store,
            bottom_bar_visible_store,
            right_sidebar_visible_store,
            contextItemsStore,
            context_info_store,
            contextToolbarOperations,
            data_tick_store,
            reloadWholeApp,
            showFABAlways,
            leftHandedFAB,
            navKey
        } from "./stores.js";
    import Icon from './components/icon.svelte';
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'
	import { pop, push } from 'svelte-spa-router';
	import { tick } from 'svelte';
	import { isDeviceSmallerThan, navGetKey, navHide, navIsVisible, navShow, navToggle, navAutoHide } from './utils';
    import {setCurrentLanguage, getLanguages, i18n, getCurrentLanguage} from './i18n.js'


    export let appConfig = undefined;
    export let mobile=false;
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
    let show_groups_switch_menu = false;
    let can_add_new_group = false;

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



        /*show_groups_switch_menu = $session.tenants.length > 1

        if($session.configuration.tenant)
        {
            reef.getAppInstanceInfo().then( (instanceInfo =>{
                if(instanceInfo?.is_public)
                {
                    show_groups_switch_menu = true;
                    can_add_new_group = true;
                }
            }))

        }
        */

    }

    function on_navigator_tab_clicked(e, key)
    {
        e.stopPropagation();
        navToggle(key);
    }

    function show_options(e)
    {
        navAutoHide()   //?

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

    function get_groups_menu()
    {
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

        if(can_add_new_group)
        {
            options.push({
                separator: true
            })
            options.push({
                caption: i18n({en:'Add group', es: 'Añadir grupo', pl: 'Dodaj grupę' }),
                icon: FaPlus,
                action: (f) => launchNewGroupWizzard()
            })
        }

        return options
    }

    function show_groups(e)
    {
        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect();
        
        let options = get_groups_menu()

        //const anchor = new DOMPoint(rect.right, rect.top)
        showMenu(rect, options, SHOW_MENU_RIGHT);
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

    let newGroupParams = {
        name: ''
    }

    let newGroupModalVisible = false;
    function launchNewGroupWizzard()
    {
        newGroupParams.name = '';
        newGroupModalVisible = true;
    }

    async function onNewGroupOK()
    {
        const appId = $session.appId
        if(!appId)
        {
            return onNewGroupCancel()
        }

        const appInstanceId = $session.configuration.tenant
        if(!appInstanceId)
        {
            return onNewGroupCancel()
        }

            const body = {
                app_id: $session.appId,
                tenant: $session.configuration.tenant,
                org_name: newGroupParams.name
            }

            const res = await reef.fetch(  "/dev/create-group-for-me",
                                {
                                    method: 'post',
                                    body : JSON.stringify(body)
                                });

            if(res.ok)
            {
                await reef.refreshTokens()
                //reloadWholeApp()
            }
            else
            {
                const result = await res.json();
                console.error(result.error);
            }

        newGroupParams.name = '';
        newGroupModalVisible = false;
    }

    function onNewGroupCancel()
    {
        newGroupParams.name = '';
        newGroupModalVisible = false;
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

<section class="no-print flex flex-col w-full h-full" on:click={clearSelection}>
    <div class="px-0 w-12 sm:w-10">
        {#each tabs as tab}
            {@const isSelected = $navKey == tab.key}
            <button
                class="h-16 px-0 flex justify-center items-center w-full text-stone-300 hover:text-stone-100 relative"
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

    {#if !mobile}

        <div class="mt-auto h-auto items-center w-full">

            {#if show_groups_switch_menu}
                <button class="h-12 px-0 flex justify-center items-center w-full text-stone-300 hover:text-stone-100"
                        on:click|stopPropagation={show_groups}>
                    <Icon s="md" component={FaUsers} />
                </button>
            {/if}

            <button
                class="h-12  px-0 flex justify-center items-center w-full text-stone-300 hover:text-stone-100"
                on:click|stopPropagation={show_options}>

                <Icon s="md" component={FaCog} />
            </button>

        </div>
    {/if} <!-- !mobile -->
</section>

    <!--Menu bind:this={menu}/-->

<Modal  bind:open={newGroupModalVisible}
        title={ i18n({en:'Create group', es:'Crear grupo', pl:'Utwórz grupę'})}
        okCaption={ i18n({en:'Create', es:'Crear', pl:'Utwórz'})}
        onOkCallback={onNewGroupOK}
        onCancelCallback={onNewGroupCancel}
        icon={FaUsers}
>
    <Input  label={i18n({en:'Group name', es:'Nombre del grupo', pl:'Nazwa grupy'})}
            placeholder=''
            self={newGroupParams}
            a="name"
            required/>
</Modal>

<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>