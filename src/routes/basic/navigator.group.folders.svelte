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
                onErrorShowAlert} from '$lib'
    import {FaRegFolder, FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive, FaUsers, FaPlus, FaRegStar, FaStar, FaShoppingBasket} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount, tick } from 'svelte';

    export let sidebar = true;

    let groupFolders = [];
    let user = {};
    let basket = {}
    let pinnedFolders = []
    let navGroupFolders;
    let navGroupItems = [];
    let navPinnedItems = [];
    
    $: currentPath = $location;

    onMount( async () =>
    {
        await initNavigator();
        return () => {}        
    })

    async function initNavigator()
    {
        if($session.isActive)
        {
            let res = await reef.post('user/query', {
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
                                Expressions:['Id','$ref', 'Title', 'href', 'Summary'],
                            },
                            {
                                Id: 12,
                                Association: 'PinnedFolders',
                                Expressions:['Id','$ref', 'Title'],
                                SubTree:[
                                    {
                                        Id: 121,
                                        Association: 'Folders/Folder',
                                        Sort: 'Order',
                                        Expressions:['Id','$ref', 'Title', 'href', 'Summary', 'Order'],
                                    }
                                ]
                            }
                        ]
                    }
                ]
            })

            if(res)
            {
                user = res.User
                basket = user.BasketFolder
                pinnedFolders = user.PinnedFolders['Folders/Folder']

                console.log(user)
                console.log(basket)
                console.log(pinnedFolders)
            }

            

        }

 

        await fetchData()
        navGroupFolders?.reload(groupFolders)
    }

    async function fetchData()
    {
        let res = await reef.get("/group/Folders?sort=Order&fields=Id,Title,Summary,Order,href,$type", onErrorShowAlert);
        console.log(res)
        if(res != null)
            groupFolders = res.Folder;
        else
            groupFolders = [];
    }

    async function reload()
    {
        await fetchData();
        navGroupFolders.reload(groupFolders)
    }

    async function addFolder(folderName, order)
    {
        await reef.post("/group/Folders/new", 
                            { 
                                Title: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
        reload();
    }

    async function changeName(folder, name)
    {
        let res = await reef.post(`/group/Folders/${folder.Id}/set`, 
                                {
                                    Title: name
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function changeSummary(folder, summary)
    {

        let res = await reef.post(`/group/Folders/${folder.Id}/set`, 
                                {
                                    Summary: summary
                                },
                                onErrorShowAlert);
        return (res != null);
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

    
    function getMyFoldersOperations(domNode, dataItem)
    {
        let menuOperations = [];
        if(dataItem == user)
            menuOperations.push({
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (f) => finishAllMyTasks()
            });

        return menuOperations;
    }

    
    let deleteModal;
    let folderToDelete;
    function askToDelete(folder)
    {
        folderToDelete = folder;
        deleteModal.show()
    }

    let archiveModal;
    let folderToArchive;
    function askToArchive(folder)
    {
        folderToArchive = folder;
        archiveModal.show();
    }

    async function archiveFolder()
    {
        if(!folderToArchive)
            return;

        await reef.post(`/group/Folders/${folderToArchive.Id}/Archive`, {}, onErrorShowAlert)
        archiveModal.hide();

        reload();
    }

    async function deleteFolder()
    {
        if(!folderToDelete)
            return;

        await reef.delete(`/group/Folders/${folderToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();

        reload();
    }

    function getFolderOperations(domNode, dataItem, navItem)
    {
        let menuOperations = [];
        menuOperations = [
            {
                caption: 'Rename',
                action: (f) => startEditing(domNode)
            },
            {
                caption: 'Edit summary',
                action: (f) => navItem.editSummary()
            },           
            {
                caption: 'Move on top',
                action: (f) => navGroupFolders.moveTop(dataItem)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navGroupFolders.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navGroupFolders.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: 'Archive',
                action: (f) => askToArchive(dataItem)
            },
            {
                caption: 'Delete',
                action: (f) => askToDelete(dataItem)
            }
        ]
        return menuOperations
    }

   

    export function requestAdd()
    {
        navGroupFolders.add(async (folderName, order) => {
            await reef.post("/group/Folders/new", 
                            { 
                                Title: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
            reload();
        })
    }

    let showGroupsSwitchMenu = false;
    let canAddNewGroup = false;
    let currentGroup = {}


    function getBasketOperations(domNode, dataItem)
    {
        let menuOperations = [];
        if(dataItem == user)
            menuOperations.push({
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (f) => finishAllMyTasks()
            });

        return menuOperations;
    }

    
</script>

{#if sidebar}
    {#if groupFolders && groupFolders.length > 0}
        {#if $session.isActive}
            {#if pinnedFolders && pinnedFolders.length > 0}
                <SidebarGroup border>
            
                    <SidebarList    objects={pinnedFolders} 
                                    orderAttrib='Order'>
                        <svelte:fragment let:item let:idx>
                            {@const href = item.href}
                            <SidebarItem   {href}
                                            icon={FaRegStar}
                                            bind:this={navPinnedItems[idx]}
                                            active={isRoutingTo(href, currentPath)}
                                            operations={(node) => getFolderOperations(node, item, navPinnedItems[idx])}
                                            selectable={item}
                                            summary={{
                                                editable: (text) => {changeSummary(item, text)},
                                                content: item.Summary}}
                                            editable={(text) => {changeName(item, text)}}>
                                {item.Title}
                            </SidebarItem>
                        </svelte:fragment>
                    </SidebarList> 
                </SidebarGroup>
            {/if}

            <SidebarGroup border>
                <SidebarItem   href="/myfolders"
                                icon={FaRegFolder}
                                active={isRoutingTo("/myfolders", currentPath)} 
                                operations={(node) => getMyFoldersOperations(node, user)}
                                summary="Personal folders"
                                selectable={user}>
                    My Folders*
                </SidebarItem>
            </SidebarGroup>
        {/if}

        <SidebarGroup border>
           
            <SidebarList    objects={groupFolders} 
                            orderAttrib='Order'
                            inserter={addFolder} 
                            inserterPlaceholder='New folder'
                            bind:this={navGroupFolders}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaRegFolder}
                                    bind:this={navGroupItems[idx]}
                                    active={isRoutingTo(href, currentPath)}
                                    operations={(node) => getFolderOperations(node, item, navGroupItems[idx])}
                                    selectable={item}
                                    summary={{
                                        editable: (text) => {changeSummary(item, text)},
                                        content: item.Summary}}
                                    editable={(text) => {changeName(item, text)}}>
                        {item.Title}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList> 
        </SidebarGroup>

        <SidebarGroup border>
            {@const href = `/folder/${basket.Id}`}
            <SidebarItem   {href}
                            icon={FaShoppingBasket}
                            active={isRoutingTo(href, currentPath)} 
                            operations={(node) => getBasketOperations(node, basket)}
                            summary="List of selected items for quick operations"
                            selectable={basket}>
                My Basket
            </SidebarItem>
        </SidebarGroup>

       
        {:else}
            <Spinner delay={3000}/>
        {/if}

{:else} <!-- !sidebar -->

    {#if groupFolders && groupFolders.length > 0}

        {#if $session.isActive}
            {#if pinnedFolders && pinnedFolders.length > 0}
                <SidebarGroup border>
                    <SidebarList    objects={pinnedFolders} 
                                    orderAttrib='Order'>
                        <svelte:fragment let:item let:idx>
                            {@const href = `${item.href}`}
                            <SidebarItem   {href}
                                            icon={FaRegFolder}
                                            bind:this={navPinnedItems[idx]}
                                            operations={(node) => getFolderOperations(node, item, navPinnedItems[idx])}
                                            {item}
                                            summary={{
                                                editable: (text) => {changeSummary(item, text)},
                                                content: item.Summary}}
                                            editable={(text) => {changeName(item, text)}}>
                                {item.Title}
                            </SidebarItem>
                        </svelte:fragment>
                    </SidebarList> 
                </SidebarGroup>
            {/if}

            <SidebarGroup border>
                <SidebarItem    href="/myfolders"
                                icon={FaRegFolder}
                                operations={(node) => getMyFoldersOperations(node, user)}
                                summary="Personal folders"
                                item={user}>
                    My Folders*
                </SidebarItem>
            </SidebarGroup>
        {/if}
        
        <SidebarGroup border>
            <SidebarList    objects={groupFolders} 
                            orderAttrib='Order'
                            bind:this={navGroupFolders}>
                <svelte:fragment let:item let:idx>
                    {@const href = `${item.href}`}
                    <SidebarItem   {href}
                                    icon={FaRegFolder}
                                    bind:this={navGroupItems[idx]}
                                    operations={(node) => getFolderOperations(node, item, navGroupItems[idx])}
                                    {item}
                                    summary={{
                                        editable: (text) => {changeSummary(item, text)},
                                        content: item.Summary}}
                                    editable={(text) => {changeName(item, text)}}>
                        {item.Title}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList> 
        </SidebarGroup>

        


    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}

<Modal  title="Delete"
        content="Are you sure you want to delete selected folder?"
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />

<Modal  title="Archive"
        content="Are you sure you want to archive selected folder?"
        icon={FaArchive}
        onOkCallback={archiveFolder}
        bind:this={archiveModal}
        />

