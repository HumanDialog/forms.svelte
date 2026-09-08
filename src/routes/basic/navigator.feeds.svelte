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
                onErrorShowAlert, i18n, ext,
                randomString, UI, isDeviceSmallerThan
            } from '$lib'
    import {FaHome, FaFolder, FaQuestion, FaDownload, FaAt, FaRegClipboard, FaComments} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { afterUpdate, onMount, tick } from 'svelte';
    import {cache} from './cache.js'

    export let sidebar = true;

    let feed_folders = [];
    let unapproved_posts_folder = null

    let feed_folders_list_element;
    let fetching_data = false

    $: current_location = $location;

    const navigator_refresher = {
        refresh: () => {
                init_navigator();
            }
    }

    onMount( () =>
    {
        init_navigator();
        UI.navigator = navigator_refresher

        return () => {
            if(UI.navigator == navigator_refresher)
                UI.navigator = null
        }
    })


    async function init_navigator()
    {
        if($session.isActive)
        {
            fetching_data = true
            
            const cache_key = `feedsNavigator`
            const cached_value = cache.get(cache_key)
            if(cached_value)
            {
                feed_folders = cached_value;
                feed_folders_list_element?.reload(feed_folders)
            }

            await fetch_data()
            feed_folders_list_element?.reload(feed_folders)
            cache.set(cache_key, feed_folders);
        }
        else
            fetching_data = false
    }

    async function fetch_data()
    {
        const limit = isDeviceSmallerThan("sm") ? 5 : 7

        let res = await reef.post('group/query', {
            Id: 1,
            Name: 'feeds',
            Tree: [
                {
                    Id: 1,
                    Association: '',
                    Expressions: ['Id', 'Name'],
                    SubTree: [
                        /*,*/
                        {
                            Id: 20,
                            Association: 'FeedsRoot',
                            Expressions: ['Id', '$ref', '$type', 'Title', 'Summary', 'href', 'icon', '$acc'],
                            SubTree:[
                                {
                                    Id: 200,
                                    Association: 'Folders',
                                    SubTreeLimit: limit,
                                    Expressions: ['Id', 'Title', 'Summary', 'Order', 'href', 'icon', '$type', '$acc']
                                }]
                        },
                        {
                            Id: 10,
                            Association: 'UnapprovedPosts',
                            Expressions: ['Id', '$ref', '$type', 'Title', 'Summary', 'href', 'icon', 'NotesCount', '$acc'],
                            
                        }
                    ]
                }
            ]
        })

        feed_folders = [];
        unapproved_posts_folder = null

        if(res != null)
        {
            if(res.Group)
            {
                if(res.Group.UnapprovedPosts)
                    unapproved_posts_folder = res.Group.UnapprovedPosts

                if(res.Group.FeedsRoot && res.Group.FeedsRoot.Folders && res.Group.FeedsRoot.Folders.length > 0)
                    feed_folders = res.Group.FeedsRoot.Folders
            }
        }
        
    }

    async function reload()
    {
        await fetch_data();
        feed_folders_list_element.reload(feed_folders)
    }

    function is_routing_to(href, current_location)
    {
        if(!sidebar)
            return false;

        let link_path = href;
        if(link_path.startsWith('#'))
            link_path = link_path.substring(1)



        if(current_location.startsWith(link_path))
            return true;
        else
            return false;
    }

    const home = {}
    const help = {}
    const download = {}
    const contact = {}

    const my_feed = {}
    const my_sent = {}

</script>

{#key current_location}
{#if sidebar}

    {#if fetching_data && !feed_folders}
        <Spinner delay={3000}/>
    {:else}
        <SidebarGroup>
            <SidebarItem    href="/feed/my"
                            icon='newspaper'
                            active={is_routing_to('/feed/my', current_location)}>
                _; My news feed; Mi feed de noticias; Mój strumień wiadomości
            </SidebarItem>
            
            <SidebarItem    href="/feed/sent"
                            icon='send'
                            active={is_routing_to('/feed/sent', current_location)}
                            summaryX="The essentials in one place">
                _; My posts; Mis publicaciones; Moje posty
            </SidebarItem>

            <!--SidebarItem    href="/feed/saved"
                            icon='bookmark'
                            active={is_routing_to('/feed/saved', current_location)}
                            summaryX="The essentials in one place">
                _; Saved posts; Publicaciones guardadas; Zapisane posty
            </SidebarItem-->
        </SidebarGroup>

        {#if unapproved_posts_folder}
            <SidebarGroup>
                <SidebarItem    href={unapproved_posts_folder.href}
                                icon='stamp'
                                active={is_routing_to(unapproved_posts_folder.href, current_location)}
                                summary={unapproved_posts_folder.Summary}>
                        {ext(unapproved_posts_folder.Title)} ({unapproved_posts_folder.NotesCount})
                    </SidebarItem>
            </SidebarGroup>
        {/if}

        {#if feed_folders && feed_folders.length > 0}
            <SidebarGroup border title='Categories'
                        moreHref="/folder/feeds">
                <SidebarList    objects={feed_folders}
                                orderAttrib='Order'
                                bind:this={feed_folders_list_element}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon='messages-square'
                                        active={is_routing_to(href, current_location)}
                                        summary={item.Summary}
                                        >
                            {item.Title}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>
            </SidebarGroup>
        {/if}

    {/if}

{:else} <!-- !sidebar -->

    {#if fetching_data && !feed_folders}
        <Spinner delay={3000}/>
    {:else}
        <SidebarGroup >
            <SidebarItem    href="/feed/my"
                            icon='newspaper'
                            item={my_feed}>
                _; My news feed; Mi feed de noticias; Mój strumień wiadomości
            </SidebarItem>

            <SidebarItem    href="/feed/sent"
                            icon='send'
                            item={my_sent}>
                _; My posts; Mis publicaciones; Moje posty
            </SidebarItem>

            <!--SidebarItem    href="/feed/saved"
                            icon='bookmark'
                            item={my_saved}>
                _; Saved posts; Publicaciones guardadas; Zapisane posty
            </SidebarItem-->
        </SidebarGroup>

        {#if unapproved_posts_folder}
            <SidebarGroup>
                <SidebarItem    href={unapproved_posts_folder.href}
                                icon='stamp'
                                item={unapproved_posts_folder}
                                summary={unapproved_posts_folder.Summary}>
                        {ext(unapproved_posts_folder.Title)} ({unapproved_posts_folder.NotesCount})
                    </SidebarItem>
            </SidebarGroup>
        {/if}

        {#if feed_folders && feed_folders.length > 0}
            <SidebarGroup border title='Categories'
                        moreHref="/folder/feeds">
                <SidebarList    objects={feed_folders}
                                orderAttrib='Order'
                                bind:this={feed_folders_list_element}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon='messages-square'
                                        {item}
                                        summary={item.Summary}
                                        >
                            {item.Title}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>
            </SidebarGroup>
        {/if}

    {/if}

{/if}
{/key}
