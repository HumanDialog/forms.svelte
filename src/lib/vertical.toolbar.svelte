<script>
    import {FaUsers, FaCog, FaToggleOn, FaToggleOff, FaSignInAlt, FaSignOutAlt, FaPlus, FaLanguage} from 'svelte-icons/fa/'
    //import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import {showMenu, SHOW_MENU_RIGHT} from '$lib/components/menu'
    import {reef} from '@humandialog/auth.svelte'
    import Modal from './modal.svelte'
    import Input from './components/inputbox.ltop.svelte'
    import {get_settings_menu} from './settings_menu'

    import {contextItemsStore,
            context_info_store,
            contextToolbarOperations,
            data_tick_store,
            reloadWholeApp,
            navKey
        } from "./stores.js";
    import Icon from './components/icon.svelte';
    import Ricon from './components/r.icon.svelte'
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
   
    
    let is_logged_in = false;
    
    
    let show_groups_switch_menu = false;
    let can_add_new_group = false;

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
        const options = get_settings_menu(appConfig, mainToolbarConfig)
        
        if(options && options.length > 0)
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

                <Ricon icon='settings' />
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