<script>
    import {    Spinner,
                SidebarGroup,
                SidebarList,
                SidebarItem,
                PaperNav,
                onErrorShowAlert, UI, i18n, ext} from '$lib'
    import {location} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount } from 'svelte';
    import { cache} from './cache.js'
    
    export let sidebar = true;

    let groupFolders = [];
    let user = {};
    let basket = {}
    let pinnedElements = []
    let navGroupFolders;
    let navPinnedElements;
    let navGroupItems = [];
    let navPinnedItems = [];

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

    function initNavigator()
    {
        if($session.isActive)
        {
            const cachedUser = cache.get('navFoldersUser')
            if(cachedUser)
            {
                user = cachedUser;
                basket = user.BasketFolder

                pinnedElements = []
                if(user.PinnedFolders.Folders)
                    pinnedElements = [...pinnedElements, ...user.PinnedFolders.Folders]

                if(user.PinnedFolders.Notes)
                    pinnedElements = [...pinnedElements, ...user.PinnedFolders.Notes]

                if(user.PinnedFolders.Tasks)
                    pinnedElements = [...pinnedElements, ...user.PinnedFolders.Tasks]

                pinnedElements.sort( (a, b) => a.Order - b.Order)

                navPinnedElements?.reload(pinnedElements)
            }

            reef.post('user/query', {
                Id: 1,
                Name: '',
                Tree:[
                    {
                        Id: 1,
                        Association: '',
                        Expressions:['Id','$ref', 'Name'],
                        SubTree: [
                            {
                                Id: 11,
                                Association: 'BasketFolder',
                                Expressions:['Id','$ref', 'Title', 'href', 'Summary', 'icon'],
                            },
                            {
                                Id: 12,
                                Association: 'PinnedFolders',
                                Expressions:['Id','$ref', 'Title', 'href'],
                                SubTree:[
                                    {
                                        Id: 121,
                                        Association: 'Folders',
                                        Expressions:['Id','$ref', 'Title', 'href', 'Summary', 'Order', 'icon', '$type'],
                                    },
                                    {
                                        Id: 122,
                                        Association: 'Notes',
                                        Expressions:['Id','$ref', 'Title', 'href', 'Summary', 'Order', 'icon', '$type'],
                                    },
                                    {
                                        Id: 123,
                                        Association: 'Tasks',
                                        Expressions:['Id','$ref', 'Title', 'href', 'Summary', 'Order', 'icon', '$type'],
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }, onErrorShowAlert).then( (res) => {
                if(res)
                {
                    user = res.User
                    basket = user.BasketFolder

                    pinnedElements = []
                    if(user.PinnedFolders.Folders)
                        pinnedElements = [...pinnedElements, ...user.PinnedFolders.Folders]

                    if(user.PinnedFolders.Notes)
                        pinnedElements = [...pinnedElements, ...user.PinnedFolders.Notes]

                    if(user.PinnedFolders.Tasks)
                        pinnedElements = [...pinnedElements, ...user.PinnedFolders.Tasks]

                    pinnedElements.sort( (a, b) => a.Order - b.Order)

                    navPinnedElements?.reload(pinnedElements)
                    cache.set('navFoldersUser', user)
                }
            })
        }

        const cachedFolders = cache.get('navFolderFolders')
        if(cachedFolders)
        {
            groupFolders = cachedFolders;
            navGroupFolders?.reload(groupFolders)
        }

        fetchGroupFolders().then(() => {
            navGroupFolders?.reload(groupFolders)
            cache.set('navFolderFolders', groupFolders)
        })
    }

    async function fetchGroupFolders()
    {
        let res = await reef.get("/group/Folders?sort=Order&fields=Id,Title,Summary,Order,href,$type,$ref,icon", onErrorShowAlert);
        if(res != null)
            groupFolders = res.Folder;
        else
            groupFolders = [];
    }

    async function reloadGroupFolders()
    {
        await fetchGroupFolders();
        navGroupFolders.reload(groupFolders)
    }

    async function reloadPinnedFolders()
    {
        await initNavigator();
    }


    function isRoutingTo(href, currentPath)
    {
        if(!sidebar)
            return false;

        let linkPath = href;
        if(linkPath.startsWith('#'))
            linkPath = linkPath.substring(1)

        //if(currentPath.startsWith(linkPath))
        if(currentPath == linkPath)
            return true;
        else
            return false;
    }

   
    const mynotes_selection = {}

</script>

{#key currentPath}
<PaperNav>

    {#if groupFolders && groupFolders.length > 0}
        {#if $session.isActive}
            {#if pinnedElements && pinnedElements.length > 0}

                <SidebarGroup title={i18n({en: 'Pinned', es: 'Sujetado', pl: 'Przypięte'})}
                        moreHref={user.PinnedFolders.href}>

                    <SidebarList    objects={pinnedElements}
                                    orderAttrib='Order'
                                    bind:this={navPinnedElements}>
                        <svelte:fragment let:item let:idx>
                            {@const href = item.href}
                            <SidebarItem   {href}
                                            icon = {item.icon}
                                            bind:this={navPinnedItems[idx]}
                                            active={isRoutingTo(href, currentPath)}
                                            >
                                {ext(item.Title)}
                            </SidebarItem>
                        </svelte:fragment>
                    </SidebarList>
                </SidebarGroup>
            {/if}

            <SidebarGroup title={i18n({en: 'Personal', es: 'Personales', pl: 'Osobiste'})}>
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
            </SidebarGroup>
        {/if}

        <SidebarGroup  title={i18n({en: 'Common', es: 'Comunes', pl: 'Wspólne'})}
                        moreHref="/group-folders">

            <SidebarList    objects={groupFolders}
                            orderAttrib='Order'
                            bind:this={navGroupFolders}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon = {item.icon}
                                    bind:this={navGroupItems[idx]}
                                    active={isRoutingTo(href, currentPath)}
                                    >
                        {ext(item.Title)}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList>
        </SidebarGroup>

        <!--SidebarGroup border>
            {@const href = `/folder/${basket.Id}`}
            <SidebarItem   {href}
                            icon={FaPaste}
                            active={isRoutingTo(href, currentPath)}
                            operations={(node) => getBasketOperations(node, basket)}
                            summary="List of selected items for quick operations"
                            selectable={basket}>
                _; My Clipboard; Mi portapapeles; Mój Schowek
            </SidebarItem>
        </SidebarGroup-->


    {:else}
        <Spinner delay={3000}/>
    {/if}


</PaperNav>
{/key}


