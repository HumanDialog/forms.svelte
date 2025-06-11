<script>
    import {    Spinner,
                startEditing,
                SidebarGroup,
                SidebarList,
                SidebarItem,
                reloadMainContentPage,
                Modal,
                reloadWholeApp,
                Input,
                onErrorShowAlert,
                randomString, UI
            } from '$lib'
    import {FaHome, FaFolder, FaQuestion, FaDownload, FaAt, FaRegClipboard, FaComments} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { afterUpdate, onMount, tick } from 'svelte';
    import {cache} from './cache.js'

    export let sidebar = true;

    let rootFolders = [];
    let user = {};
    let navFolders;
    let navItems = [];
    let waitForRequest = false

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
        if($session.isActive)
        {
            waitForRequest = true
            reef.get("/user", onErrorShowAlert).then((res) => {
                if(res != null)
                    user = res.User;
            })



            const cacheKey = `foldersNavigator`
            const cachedValue = cache.get(cacheKey)
            if(cachedValue)
            {
                rootFolders = cachedValue;
                navFolders?.reload(rootFolders)
            }

            await fetchData()
            navFolders?.reload(rootFolders)
            cache.set(cacheKey, rootFolders);
        }
        else
            waitForRequest = false
    }

    async function fetchData()
    {
        let res = await reef.get("/group/Folders?sort=Order&fields=Id,Title,Summary,Order,href,icon,$type", onErrorShowAlert);
        if(res != null)
            rootFolders = res.Folder;
        else
            rootFolders = [];
    }

    async function reload()
    {
        await fetchData();
        navFolders.reload(rootFolders)
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

    function getFolderIcon(folder)
    {
        if(folder.icon)
        {
            switch(folder.icon)
            {
            case 'Folder':
                return FaFolder;
            case 'Clipboard':
                return FaRegClipboard;
            case 'Discussion':
                return FaComments;
            default:
                return FaFolder
            }
        }
        else
            return FaFolder
    }

    const home = {}
    const help = {}
    const download = {}
    const contact = {}

</script>

{#key currentPath}
{#if sidebar}

    {#if waitForRequest && !rootFolders}
        <Spinner delay={3000}/>
    {:else}
        <SidebarGroup >
            <SidebarItem    href="/thome"
                            icon={FaHome}
                            active={isRoutingTo('/thome', currentPath)}
                            summary="The essentials in one place">
                Home
            </SidebarItem>
        </SidebarGroup>

        {#if rootFolders && rootFolders.length > 0}
            <SidebarGroup border>
                <SidebarList    objects={rootFolders}
                                orderAttrib='Order'
                                bind:this={navFolders}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={getFolderIcon(item)}
                                        bind:this={navItems[idx]}
                                        active={isRoutingTo(href, currentPath)}
                                        summary={item.Summary}
                                        >
                            {item.Title}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>
            </SidebarGroup>
        {/if}

            <SidebarGroup border>
                <SidebarItem    href="/doc/reef-dev-tour-311"
                                icon={FaQuestion}
                                summary="How to get started and use Tilos">
                    Help
                </SidebarItem>

                <SidebarItem    href="/tdownload"
                                active={isRoutingTo("/tdownload", currentPath)}
                                icon={FaDownload}
                                summary="Download the installer and check the release notes">
                    Downloads
                </SidebarItem>

                <SidebarItem    href="/tcontact"
                                active={isRoutingTo("/tcontact", currentPath)}
                                icon={FaAt}
                                summary="Contact us directly">
                    Contact us
                </SidebarItem>
            </SidebarGroup>
    {/if}

{:else} <!-- !sidebar -->

    {#if waitForRequest && !rootFolders}
        <Spinner delay={3000}/>
    {:else}
        <SidebarGroup >
            <SidebarItem    href="/thome"
                            icon={FaHome}
                            item={home}
                            summary="The essentials in one place">
                Home
            </SidebarItem>
        </SidebarGroup>

        {#if rootFolders && rootFolders.length > 0}
            <SidebarGroup border>
                <SidebarList    objects={rootFolders}
                                orderAttrib='Order'
                                bind:this={navFolders}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={getFolderIcon(item)}
                                        bind:this={navItems[idx]}
                                        {item}
                                        summary={item.Summary}
                                        >
                            {item.Title}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>
            </SidebarGroup>
        {/if}

            <SidebarGroup border>
                <SidebarItem    href="/doc/reef-dev-tour-311"
                                icon={FaQuestion}
                                item={help}
                                summary="How to get started and use Tilos">
                    Help
                </SidebarItem>

                <SidebarItem    href="/tdownload"
                                icon={FaDownload}
                                item={download}
                                summary="Download the installer and check the release notes">
                    Downloads
                </SidebarItem>

                <SidebarItem    href="/tcontact"
                                icon={FaAt}
                                item={contact}
                                summary="Contact us directly">
                    Contact us
                </SidebarItem>
            </SidebarGroup>
    {/if}

{/if}
{/key}
