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


    let groupTaskLists = [];
    let groupProjects = [];

    let user = {};
    let navUserLists;
    let navGroupLists;
    let navGroupProjects;

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

        const cachedGroupProjects = cache.get('projectsNavigator')
        if(cachedGroupProjects)
        {
            groupProjects = cachedGroupProjects;
            navGroupProjects?.reload(groupProjects)
        }

        const cachedGroupLists = cache.get('listsNavigator_1')
        if(cachedGroupLists)
        {
            groupTaskLists = cachedGroupLists;
            navGroupLists?.reload(groupTaskLists)
        }

        await fetchData()

        navGroupLists?.reload(groupTaskLists)
        navGroupProjects?.reload(groupProjects)


        cache.set('listsNavigator_1', groupTaskLists);
        cache.set('projectsNavigator', groupProjects)
    }

    async function fetchData()
    {
        const limit = isDeviceSmallerThan("sm") ? 7 : 12

       
        const res  = await reef.post('group/query', {
            Id: 2,
            Name: "group tasklists",
            ExpandLevel: 1,
            Limit: 3,
            Tree: [
                {
                    Id: 20,
                    Association: 'Projects',
                    SubTreeLimit: 3,
                    Sort: "Order",
                    Expressions: ['Id', 'Title', 'Order', 'href', '$ref', '$type']
                },
                {
                    Id: 21,
                    Association: 'Lists',
                    SubTreeLimit: 20,
                    Sort: "Order",
                    Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref', '$type']
                }
            ]
        })


        groupProjects = res.Project ?? []
        groupTaskLists = res.TaskList ?? [];

    }

    async function reload()
    {
        await fetchData();
        navGroupLists.reload(groupTaskLists)
        navGroupProjects.reload(groupProjects)
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
            <SidebarGroup   title={i18n({en: 'Projects', es: 'Mis Proyectos', pl: 'Projekty'})}
                            moreHref="/allprojects">

                <SidebarList    objects={groupProjects}
                                orderAttrib='Order'
                                bind:this={navGroupProjects}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon='building'
                                        active={isRoutingTo(href, currentPath)}
                                        >
                            {item.Title}
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
        <SidebarGroup border title={i18n({en: 'Others', es: 'Otros', pl: 'Inne'})}>
                <SidebarItem   href="/listtemplates"
                                icon='notebook-tabs'
                                active={isRoutingTo("/myday", currentPath)}
                                selectable={myday}>
                    _; List templates; Modelos de cartas; Wzorce list
                </SidebarItem>
        </SidebarGroup>

    {:else}
        <Spinner delay={3000}/>
    {/if}

</div>
{/key}
