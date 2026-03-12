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


        await fetchData()

        navUserLists?.reload(userTaskLists)

        cache.set('listsNavigator_0', userTaskLists);

    }

    async function fetchData()
    {
        const limit = isDeviceSmallerThan("sm") ? 7 : 12

        const userTasklistsPromise = reef.post('user/query', {
            Id: 1,
            Name: 'user tasklists',
            Limit: 10,
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


        const results = await Promise.all([userTasklistsPromise])

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

    }

    async function reload()
    {
        await fetchData();
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
    const mynotes_selection = {}

</script>

{#key currentPath}
<div class="w-full prose prose-base prose-zinc dark:prose-invert prose-a:no-underline ">


        {#if $session.isActive}
            <!--SidebarGroup border title={i18n({en: 'Current work', es: 'Trabajo actual', pl: 'Bieżąca praca'})}-->
            <hr class="my-0">
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
                    _; Observed lists; Trabajo común; Obserwowane listy
                </SidebarItem>
            <!--/SidebarGroup-->


                <SidebarItem   href="/mynotes"
                                icon = 'file-text'
                                active={isRoutingTo("/mynotes", currentPath)}

                                selectable={mynotes_selection}>
                    _; My notes; Mis notas; Moje notatki
                </SidebarItem>
                <SidebarItem   href="/myfolders"
                                icon = 'folder'
                                active={isRoutingTo("/myfolders", currentPath)}
                                >
                    _; My Folders; Mis carpetas; Moje Foldery
                </SidebarItem>
                <SidebarItem   href="/mytasks"
                                icon='square-pen'
                                active={isRoutingTo("/mytasks", currentPath)}
                                selectable={user}> <!-- summary={i18n(["All active tasks assigned to me", "Tareas activas asignadas a mí", "Aktywne zadania przypisane do mnie"])} -->
                    _; Tasks assigned to me; Tareas que me han sido asignadas; Zadania przydzielone do mnie
                </SidebarItem>

                {#if userTaskLists && userTaskLists.length > 0}

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

        <SidebarGroup   title={i18n({en: 'Others', es: 'Otros', pl: 'Inne'})}
                        >

                <SidebarItem   href="/folder/myarchive"
                                icon='archive'
                                active={isRoutingTo("/folder/myarchive", currentPath)}
                                selectable={myday}>
                    _; My archive; Mi día; Moje archiwum
                </SidebarItem>
                <SidebarItem   href="/folder/mytrash"
                                icon='trash'
                                active={isRoutingTo("/folder/mytrash", currentPath)}
                                selectable={teamday}>
                    _; My trash; Trabajo común; Mój kosz
                </SidebarItem>
        </SidebarGroup>

    {:else}
        <Spinner delay={3000}/>
    {/if}

</div>
{/key}
