<script>
    import {reef, session, Authorized} from '@humandialog/auth.svelte'
	import {Layout, onErrorShowAlert} from '$lib';
    import Sidebar from './sidebar.svelte'
    
    import SidebarFolders from './sidebar.folders.svelte'

    import {push} from 'svelte-spa-router'

    import Sidebar2 from './sidebar2.svelte'
    import AppIcon from './appicon.svelte'
    import FaFolder from 'svelte-icons/fa/FaFolder.svelte'
    import {FaUsersCog, FaSignOutAlt, FaList} from 'svelte-icons/fa/'

    import Tasklist from './tasklist.svelte';
    import Folder from './folder.svelte';
    import Task from './task.svelte'
    import Note from './note.svelte'
    import Board from './list.board.svelte';
    import MyTasks from './mytasks.svelte'
    import MyFolders from './myfolders.svelte'
    import Members from './members.svelte'
    import AppMain from './AppMain.svelte'

    import {Console} from '$lib'
    import { tick, onMount } from 'svelte';

    const objectreef_io = 'localhost:1996'
    const appId = 'octopus'
    const tenantId = 'octopus'
    const proto = 'http'

    $: init($session)

    async function init(...args)
    {
        if(!$session.isActive && !$session.isUnauthorizedGuest)
        {
            await tick();
            reef.redirectToSignIn();
        }

    }

    const authorizedLayout = {
                sidebar : {
                    'TOC': {
                        icon: FaList,
                        component: Sidebar
                    },

                    'Folders': {
                        icon: FaFolder,
                        component: SidebarFolders
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/note' :       { component: Note },
                        '/note/*' :     { component: Note },
                        '/listboard' :  { component: Board},
                        '/listboard/*': { component: Board},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks },
                        '/folder'    :  { component: Folder },
                        '/folder/*'  :  { component: Folder },
                        '/myfolders' :  { component: MyFolders },
                        '/myfolders/*': { component: MyFolders },
                        '/members'   :  { component: Members }
                    }
                },
                mainToolbar : {
                    signin: true,
                    customOperations:[
                        {
                            caption: 'Members',
                            icon: FaUsersCog,
                            action: (f) => { push(`/members`) }
                        }
                    ]
                },
                selectionDetails:{
                    caption: 'Console',
                    component: Console
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                }

    }

    const guestLayout = {
                sidebar : {
                    'TOC': {
                        icon: FaList,
                        component: Sidebar
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/listboard' :  { component: Board},
                        '/listboard/*': { component: Board}
                    }
                },
                mainToolbar : {
                    customOperations:[
                        {
                            caption: 'Leave guest session',
                            icon: FaSignOutAlt,
                            action: (f) => { 
                                $session.isUnauthorizedGuest = false 
                                push('/');
                            }
                        }
                    ]
                },
                selectionDetails:{
                    caption: 'Console',
                    component: Console
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                },
                autoRedirectToSignIn: false
    }

	
    let isAlreadyConfigured = false
    let hasPublicContent = false
    async function configurePublicSession()
    {
        if(isAlreadyConfigured)
            return hasPublicContent;

        isAlreadyConfigured = true

        const lastChosenTenantId = $session.lastChosenTenantId;
        let result = null;
        try {
            const res = await fetch(`${proto}://${tenantId}.${objectreef_io}/json/anyv/app/PublicGroups`, {
                                    method: 'get',
                                    headers:{
                                        'Accept':'application/json',
                                        'X-Reef-Flags': '1'
                                    }})
            if(res.ok)
            {
                result = await res.json();
            }
            else
            {
                const err = await res.text()
                console.error(err)
                onErrorShowAlert(err);
            }
        }
        catch(err)
        {
            console.error(err)
            onErrorShowAlert(err);
        }

        //$session.setCurrentTenantAPI(`${proto}://${tenantId}.${objectreef_io}/`, '')
        //const result = await reef.get(`app/PublicGroups`)
        if(result)
        {
            let groupInfos = []
            result.Group.forEach(g => {
                groupInfos.push({
                    id: `${tenantId}/${g.Id}`,
                    url: `${proto}://${tenantId}.${objectreef_io}/`,
                    name: g.Name,
                    headers: [
                        {
                            key: 'X-Reef-Group-Id',
                            value: `${g.Id}`
                        },
                        {
                            key: 'X-Reef-Flags',
                            value: '1'
                        }
                    ]
                })
            })

            if(groupInfos.length > 0)
            {
                $session.tenants = groupInfos;

                let currentTenant;
                
                if(lastChosenTenantId)
                {
                    currentTenant = groupInfos.find(t => t.id == lastChosenTenantId)
                    if(!currentTenant)
                        currentTenant = groupInfos[0];
                }
                else
                {
                    currentTenant = groupInfos[0];
                }

                $session.setCurrentTenantAPI(currentTenant.url, currentTenant.id)
                return true;
            }
            else
            {
                return false;
            }
        }
        else
            return false;
    }

</script>

<Authorized>
    {#if $session.isUnauthorizedGuest}
        {#await configurePublicSession()}
            <p>Loading public content</p>
        {:then hasContent} 
            {#if hasContent}
                <Layout layout={guestLayout}/>
            {:else}
                <p>There is no public content for this application</p>
            {/if}
        {/await}
    {:else}
        <Layout layout={authorizedLayout}/>
    {/if}
</Authorized>