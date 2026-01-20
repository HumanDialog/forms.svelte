<script>
    import {    Spinner,
                SidebarGroup,
                SidebarList,
                SidebarItem,
                onErrorShowAlert,
                UI, i18n, ext, isDeviceSmallerThan} from '$lib'
    import {location} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount } from 'svelte';
    import {cache} from './cache.js'

    export let sidebar = true;

    let userTaskLists = [];
    let groupTaskLists = [];
    let user = {};
    let navUserLists;
    let navGroupLists;

    $: currentPath = $location;

    const navRefresher = {
        refresh: () => {
                initNavigator();
            }
    }

    onMount( () =>
    {
        initNavigator();
        UI.navigator = navRefresher

        return () => {
            if(UI.navigator == navRefresher)
                UI.navigator = null
        }
    })


    async function initNavigator()
    {
        const cachedUserLists = cache.get('listsNavigator_0')
        if(cachedUserLists)
        {
            userTaskLists = cachedUserLists;
            navUserLists?.reload(userTaskLists)
        }

        const cachedGroupLists = cache.get('listsNavigator_1')
        if(cachedGroupLists)
        {
            groupTaskLists = cachedGroupLists;
            navGroupLists?.reload(groupTaskLists)
        }

        await fetchData()

        navGroupLists?.reload(groupTaskLists)
        navUserLists?.reload(userTaskLists)

        cache.set('listsNavigator_0', userTaskLists);
        cache.set('listsNavigator_1', groupTaskLists);
    }

    async function fetchData()
    {
        const limit = isDeviceSmallerThan("sm") ? 7 : 12

        const userTasklistsPromise = reef.post('user/query', {
            Id: 1,
            Name: 'user tasklists',
            Limit: limit,
            Tree: [
                {
                    Id: 11,
                    Association: '',
                    Expressions: ['Id', '$ref', 'href', 'Name'],
                    SubTree: [
                        {
                            Id: 110,
                            Association: 'MyLists',
                            Sort: 'Order',
                            Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref', '$type']
                        }
                    ]
                }
            ]
        }, onErrorShowAlert)

        const groupTasklistsPromise = reef.post('group/query', {
            Id: 2,
            Name: "group tasklists",
            ExpandLevel: 1,
            Limit: limit,
            Tree: [
                {
                    Id: 21,
                    Association: 'Lists',
                    Sort: "Order",
                    Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref', '$type']
                }
            ]
        }, onErrorShowAlert)

        const results = await Promise.all([userTasklistsPromise, groupTasklistsPromise])

        if(results[0])
        {
            user = results[0].User;
            userTaskLists = user.MyLists
        }
        else
        {
            user = null
            userTaskLists = []
        }

        if(results[1])
            groupTaskLists = results[1].TaskList;
        else
            groupTaskLists = []
    }

    async function reload()
    {
        await fetchData();
        navGroupLists.reload(groupTaskLists)
        navUserLists.reload(userTaskLists)
    }

    function isRoutingTo(href, currentPath)
    {
        if(!sidebar)
            return false;

        let linkPath = href;
        if(linkPath.startsWith('#'))
            linkPath = linkPath.substring(1)



        if(currentPath.startsWith(linkPath))
            return true;
        else
            return false;
    }

    const myday = {}
    const teamday = {}

</script>

{#key currentPath}
<div class="w-full prose prose-base prose-zinc dark:prose-invert prose-a:no-underline ">

    {#if groupTaskLists && groupTaskLists.length > 0}

        {#if $session.isActive}
            <SidebarGroup border title={i18n({en: 'Current work', es: 'Trabajo actual', pl: 'Bieżąca praca'})}>
                <SidebarItem   href="/myday"
                                icon='calendar'
                                active={isRoutingTo("/myday", currentPath)}
                                selectable={myday}>
                    _; My day; Mi día; Mój dzień
                </SidebarItem>
                <SidebarItem   href="/teamday"
                                icon='calendars'
                                active={isRoutingTo("/teamday", currentPath)}
                                selectable={teamday}>
                    _; Common work; Trabajo común; Wspólna praca
                </SidebarItem>
                <SidebarItem   href="/mytasks"
                                icon='square-pen'
                                active={isRoutingTo("/mytasks", currentPath)}
                                selectable={user}> <!-- summary={i18n(["All active tasks assigned to me", "Tareas activas asignadas a mí", "Aktywne zadania przypisane do mnie"])} -->
                    _; Assigned to me; Asignado a mí; Przydzielone do mnie
                </SidebarItem>
            </SidebarGroup>

            <SidebarGroup   title={i18n({en: 'My lists', es: 'Mis listas', pl: 'Moje listy'})}
                            moreHref="/mylists">

                <SidebarList    objects={userTaskLists}
                                orderAttrib='Order'
                                bind:this={navUserLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon='notebook'
                                        active={isRoutingTo(href, currentPath)}
                                        >
                            {ext(item.Name)}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>
            </SidebarGroup>

        {/if}

        <SidebarGroup   title={i18n({en: 'Common lists', es: 'Listas comunes', pl: 'Wspólne listy'})}
                        moreHref="/alllists">

            <SidebarList    objects={groupTaskLists}
                            orderAttrib='Order'
                            bind:this={navGroupLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon='notebook'
                                    active={isRoutingTo(href, currentPath)}
                                    >
                        {ext(item.Name)}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList>
        </SidebarGroup>

    {:else}
        <Spinner delay={3000}/>
    {/if}

</div>
{/key}

