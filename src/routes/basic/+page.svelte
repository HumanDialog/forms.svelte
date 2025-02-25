<script>
    import {reef, session, AuthorizedView, signInHRef, signUpHRef, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
	import {Layout, onErrorShowAlert} from '$lib';

    import Sidebar from './sidebar.svelte'
    import SidebarFolders from './sidebar.folders.svelte'
    
    import AppIcon from './appicon.svelte'
    import FaFolder from 'svelte-icons/fa/FaFolder.svelte'
    import {FaUsersCog, FaSignOutAlt} from 'svelte-icons/fa/'
    import {push} from 'svelte-spa-router'
    
    
	import Tasklist from './tasklist.svelte';
    import Task from './task.svelte'
    import Board from './list.board.svelte';
    import MyTasks from './mytasks.svelte'
    import Members from './members.svelte'
    import Main from './main.svelte'
    import Cookies from './cookies.svelte';
    import Landing from './landing/root.svelte'
    import {Console} from '$lib'
    
	
    const domain = 'localhost:1996'
    const appId = 'octopus'
    const tenantId = 'octopus'
    const proto = 'http'
    
    reef.configure( {
            mode: 'local',
            remote:{
                iss: `${proto}://${domain}`,
                clientID: 'SampleClientId',
                clientSecret: 'SampleClientSecret',
                scope: `openid profile email ${appId}`,
                apiVersion: 'v001',
                tenant: `${tenantId}`,
                groupsOnly: true
            },
            local: {
                api:    "http://127.0.0.1:1996/",
                //api:    "http://192.168.0.102:1996/",
                users:
                [
                    {
                        username: "alice@example.com",
                        role: 'GroupOwner',
                        groupId: 13
                    },
                    {
                        username: "bob@example.com",
                        role: 'Guest',
                        groupId: 13
                    }
                ],
                apiVersion: "v001"}
            });

    const authorizedLayout = {
                sidebar : {
                    'TOC': {
                        icon: AppIcon,
                        component: Sidebar
                    },
                    'Folders': {
                        icon: FaFolder,
                        component: SidebarFolders
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: Main},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/listboard' :  { component: Board},
                        '/listboard/*': { component: Board},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks },
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
                        icon: AppIcon,
                        component: Sidebar
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: Main},
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
            const res = await fetch(`${proto}://${tenantId}.${domain}/json/anyv/app/PublicGroups`, {
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

        //$session.setCurrentTenantAPI(`${proto}://${tenantId}.${domain}/`, '')
        //const result = await reef.get(`app/PublicGroups`)
        if(result)
        {
            let groupInfos = []
            result.Group.forEach(g => {
                groupInfos.push({
                    id: `${tenantId}/${g.Id}`,
                    url: `${proto}://${tenantId}.${domain}/`,
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

<AuthorizedView optionalGuestMode automaticallyRefreshTokens={true}>
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

    <NotAuthorized>
        <Landing/>
    </NotAuthorized>
    <Cookies/>
</AuthorizedView>
