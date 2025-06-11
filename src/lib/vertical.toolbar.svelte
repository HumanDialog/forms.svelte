<script>
    import {FaUsers, FaCog, FaToggleOn, FaToggleOff, FaSignInAlt, FaSignOutAlt, FaPlus} from 'svelte-icons/fa/'
    //import GoPrimitiveDot from 'svelte-icons/go/GoPrimitiveDot.svelte'
    import {showMenu} from '$lib/components/menu'
    import {reef} from '@humandialog/auth.svelte'
    import Modal from './modal.svelte'
    import Input from './components/inputbox.ltop.svelte'
    //import Menu from '$lib/components/contextmenu.svelte'

    import {dark_mode_store, 
            toggle_sidebar, 
            show_sidebar,
            hide_sidebar,
            tools_visible_store,
            bottom_bar_visible_store, 
            right_sidebar_visible_store,
            main_sidebar_visible_store,
            contextItemsStore,
            context_info_store,
            contextToolbarOperations,
            data_tick_store,
            reloadWholeApp
        } from "./stores.js";     
    import Icon from './components/icon.svelte';
    import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'
	import { pop, push } from 'svelte-spa-router';
	import { tick } from 'svelte';
	import { popNavigationPage } from './utils';
    

    export let appConfig = undefined;
    export let mobile=false;
    export let clearsContext = 'sel props'
    
    export let definedTabs = undefined
    export let mainToolbarConfig = undefined
    
    let tabs = new Array();
    let config = null;
    let has_selection_details = false;
    let selection_detils_caption = 'Properties';
    
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
                selection_detils_caption = appConfig.selectionDetails.caption ?? 'Properties'
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
                            onclick: (e) => on_navigator_tab_clicked(e, key)
                        }

                        tabs.push(tab); 
                    }
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
       
         if(!mobile)
            toggle_sidebar(key);
        else
        {
            if($main_sidebar_visible_store == key)
                popNavigationPage();
            else
                show_sidebar(key);
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
                        caption: selection_detils_caption,
                        icon: $bottom_bar_visible_store ? FaToggleOn : FaToggleOff,
                        action: (focused) => { $bottom_bar_visible_store = !$bottom_bar_visible_store }
                    });
        }
        
        let pt = new DOMPoint(rect.right, rect.top)
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

        if(can_add_new_group)
        {
            options.push({
                separator: true
            })
            options.push({
                caption: 'Add group',
                icon: FaPlus,
                action: (f) => launchNewGroupWizzard()
            })
        }

        
        let pt = new DOMPoint(rect.right, rect.top)
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
    
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<section class="no-print flex flex-col w-full h-full" on:click={clearSelection}>
    <div class="px-0 w-12 sm:w-10">
        {#each tabs as tab}
            {@const isSelected = $main_sidebar_visible_store == tab.key}
            <button
                class="h-16 px-0 flex justify-center items-center w-full text-stone-300 hover:text-stone-100"
                class:bg-orange-500={isSelected}
                on:click={tab.onclick}>
                
                <Icon s="xl" component={tab.icon}/>
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
        title='Create group'
        okCaption='Create'
        onOkCallback={onNewGroupOK}
        onCancelCallback={onNewGroupCancel}
        icon={FaUsers}
>
    <Input  label='Group name' 
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