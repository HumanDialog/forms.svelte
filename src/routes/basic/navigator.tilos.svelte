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
                onErrorShowAlert, i18n,
                randomString, UI, isDeviceSmallerThan
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



            const cacheKey = `tilosNavigator`
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
        const limit = isDeviceSmallerThan("sm") ? 5 : 7

        let res = await reef.post('group/FeedsRoot/query', {
            Id: 1,
            Name: 'feeds',
            Limit: limit,
            Tree: [
                {
                    Id: 11,
                    Association: 'Folders',
                    Sort: "Order",
                    Expressions: ['Id', 'Title', 'Summary', 'Order', 'href', 'icon', '$type']
                }
            ]
        })

        if(res != null)
            rootFolders = res.FolderFolder;
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
        <SidebarGroup>
            <SidebarItem    href="/feed/my"
                            icon='newspaper'
                            active={isRoutingTo('/feed/my', currentPath)}
                            summaryX="The essentials in one place">
                _; My news feed; Mi feed de noticias; Mój strumień wiadomości
            </SidebarItem>
            
            <SidebarItem    href="/feed/sent"
                            icon='send'
                            active={isRoutingTo('/feed/sent', currentPath)}
                            summaryX="The essentials in one place">
                _; My posts; Mis publicaciones; Moje posty
            </SidebarItem>

            <SidebarItem    href="/feed/saved"
                            icon='bookmark'
                            active={isRoutingTo('/feed/saved', currentPath)}
                            summaryX="The essentials in one place">
                _; Saved posts; Publicaciones guardadas; Zapisane posty
            </SidebarItem>
        </SidebarGroup>

        {#if rootFolders && rootFolders.length > 0}
            <SidebarGroup border title='Categories'
                        moreHref="/folder/feeds">
                <SidebarList    objects={rootFolders}
                                orderAttrib='Order'
                                bind:this={navFolders}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon='messages-square'
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
                                hrefX='https://tiloshelp.trimble.com/Tilos-Help-Home'
                                icon='circle-question-mark'
                                summary="How to get started and use Tilos">
                    Help
                </SidebarItem>

                <SidebarItem    href="/tdownload"
                                active={isRoutingTo("/tdownload", currentPath)}
                                icon='download'
                                summary="Download the installer and check the release notes">
                    Downloads
                </SidebarItem>

                <SidebarItem    href="/tcontact"
                                active={isRoutingTo("/tcontact", currentPath)}
                                icon='at-sign'
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
                <SidebarItem    hrefX="/doc/reef-dev-tour-311"
                                href='https://tiloshelp.trimble.com/Tilos-Help-Home'
                                icon='circle-question-mark'
                                item={help}
                                summary="How to get started and use TILOS">
                    Help
                </SidebarItem>

                <SidebarItem    href="/tdownload"
                                icon='download'
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
