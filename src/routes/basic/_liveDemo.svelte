<script>
    import Layout from '$lib/desk.svelte'
    import {reef, session} from '@humandialog/auth.svelte'

    import Sidebar from './sidebar.svelte'
    import AppIcon from './appicon.svelte'
    import {FaUsersCog} from 'svelte-icons/fa/'
    import {push} from 'svelte-spa-router'
    
	import Tasklist from './tasklist.svelte';
    import Task from './task.svelte'
    import Board from './list.board.svelte';
    import MyTasks from './mytasks.svelte'
    import Members from './members.svelte'
    import Main from './main.svelte'
    import {Console} from '$lib'
	import { onMount } from 'svelte';

    const domain = 'objectreef.local:1996'
    const appId = 'octopus'
    const tenantId = 'octopus'

    reef.configure( {
            mode: 'remote',
            remote:{
                iss: `http://${domain}`,
                clientID: 'SampleClientId',
                clientSecret: 'SampleClientSecret',
                scope: `openid profile email ${appId}`,
                apiVersion: 'v001',
                tenant: `${tenantId}`
            }
            });

    const layout = {
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

    let hasPublicContent = false

    onMount( async () => {
        $session.setCurrentTenantAPI(`http://${tenantId}.${domain}/`, '')
        const res = await reef.get(`app/PublicGroups`)
        if(res)
        {
            let groupInfos = []
            res.Group.forEach(g => {
                groupInfos.push({
                    id: `${tenantId}/${g.Id}`,
                    url: `http://${tenantId}.${domain}/`,
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
                hasPublicContent = true;
                $session.tenants = groupInfos;
                const firstGroup = groupInfos[0];
                $session.setCurrentTenantAPI(firstGroup.url, firstGroup.id)
            }
            else
            {
                hasPublicContent = false;
            }
        }
        else
            hasPublicContent = false;
    })

</script>

{#if hasPublicContent}
    <Layout {layout}/>
{:else}
    <p>There is no public content for this application</p>
{/if}

