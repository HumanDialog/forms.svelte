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
    import {FaRegFolder, FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive, FaUsers, FaPlus} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount, tick } from 'svelte';

    export let sidebar = true;

    let taskLists = [];
    let user = {};
    let navLists;
    let navItems = [];
    
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
            let res = await reef.get("/user", onErrorShowAlert);
            if(res != null)
                user = res.User;
        }

 

        await fetchData()
        navLists?.reload(taskLists)
    }

    async function fetchData()
    {
        let res = await reef.get("/group/Folders?sort=Order&fields=Id,Title,Order,href,$type", onErrorShowAlert);
        console.log(res)
        if(res != null)
            taskLists = res.Folder;
        else
            taskLists = [];
    }

    async function reload()
    {
        await fetchData();
        navLists.reload(taskLists)
    }

    async function addFolder(folderName, order)
    {
        await reef.post("/group/Lists/new", 
                            { 
                                Name: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
        reload();
    }

    async function changeName(folder, name)
    {
        let res = await reef.post(`/group/Folders/${folder.Id}/set`, 
                                {
                                    Name: name
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function changeSummary(folder, summary)
    {

        let res = await reef.post(`/group/Lists/${folder.Id}/set`, 
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
        linkPath.startsWith('#')
            linkPath = linkPath.substring(1)

        

        if(currentPath.startsWith(linkPath))
            return true;
        else
            return false;
    }

    
    function getUserListOperations(domNode, dataItem)
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
    let listToDelete;
    function askToDelete(list)
    {
        listToDelete = list;
        deleteModal.show()
    }

    let archiveModal;
    let listToArchive;
    function askToArchive(list)
    {
        listToArchive = list;
        archiveModal.show();
    }

    async function archiveList()
    {
        if(!listToArchive)
            return;

        await reef.post(`/group/Lists/${listToArchive.Id}/Archive`, {}, onErrorShowAlert)
        archiveModal.hide();

        reload();
    }

    async function deleteList()
    {
        if(!listToDelete)
            return;

        await reef.delete(`/group/Lists/${listToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();

        reload();
    }

    function getTaskListOperations(domNode, dataItem, navItem)
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
                caption: 'Finish all',
                action: (f) => finishAllOnList(dataItem)
            },
            {
                caption: 'Move on top',
                action: (f) => navLists.moveTop(dataItem)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navLists.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navLists.moveDown(dataItem)

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

    let archivedLists = []
    let navArchivedLists;
    async function onExpandArchived()
    {
        let res = await reef.get("/group/ArchivedLists?sort=-Id&fields=Id,Name,$type", onErrorShowAlert);
        if(res != null)
        {
            archivedLists = res.TaskList;
            navArchivedLists.reload(archivedLists)

        }
        else
            archivedLists = [];
    }

    export function requestaddFolder()
    {
        navLists.add(async (folderName, order) => {
            await reef.post("/group/Lists/new", 
                            { 
                                Name: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
            reload();
        })
    }

    let showGroupsSwitchMenu = false;
    let canAddNewGroup = false;
    let currentGroup = {}

    

   

    
</script>

{#if sidebar}
    {#if taskLists && taskLists.length > 0}
        {#if $session.isActive}
            {@const border=showGroupsSwitchMenu}
            <SidebarGroup {border}>
                <SidebarItem   href="#/myfolders"
                                icon={FaRegFolder}
                                active={isRoutingTo("#/myfolders", currentPath)} 
                                operations={(node) => getUserListOperations(node, user)}
                                summary="Personal folders"
                                selectable={user}>
                    My Folders*
                </SidebarItem>
            </SidebarGroup>
        {/if}

        <SidebarGroup border>
           
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            inserter={addFolder} 
                            inserterPlaceholder='New list'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaRegFolder}
                                    bind:this={navItems[idx]}
                                    active={isRoutingTo(`#/tasklist/${item.Id}`, currentPath) || isRoutingTo(`#/listboard/${item.Id}`, currentPath)}
                                    operations={(node) => getTaskListOperations(node, item, navItems[idx])}
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

       

        {:else}
            <Spinner delay={3000}/>
        {/if}

{:else} <!-- !sidebar -->

    {#if taskLists && taskLists.length > 0}

    {#if showGroupsSwitchMenu}
        <SidebarGroup>
            <SidebarItem    href=""    
                            icon={FaUsers}
                            operations={(n) => getGroupsMenu()}
                            item={currentGroup}>
                {currentGroup?.name}
            </SidebarItem>
        </SidebarGroup>
    {/if}
        
        {#if $session.isActive}
            {@const border=showGroupsSwitchMenu}
            <SidebarGroup {border}>
                <SidebarItem    href="#/mytasks"
                                icon={FaList}
                                operations={(node) => getUserListOperations(node, user)}
                                summary="All active tasks assigned to me."
                                item={user}>
                    My Tasks
                </SidebarItem>
            </SidebarGroup>
        {/if}
        
        <SidebarGroup border>
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = `#${item.href}`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    bind:this={navItems[idx]}
                                    operations={(node) => getTaskListOperations(node, item, navItems[idx])}
                                    {item}
                                    summary={{
                                        editable: (text) => {changeSummary(item, text)},
                                        content: item.Summary}}
                                    editable={(text) => {changeName(item, text)}}>
                        {item.Name}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList> 
        </SidebarGroup>

        <SidebarGroup border title='Archived' collapsable onExpand={onExpandArchived}>
            <SidebarList    objects={archivedLists}
                            bind:this={navArchivedLists}>
                <svelte:fragment let:item>
                    {@const href = `#/tasklist/${item.Id}?archivedList`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    summary={item.Summary}
                                    {item}>
                        {item.Name}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList>
            
        </SidebarGroup>

        <SidebarGroup>
            <SidebarItem    href=""  >
                            
                Lorem ipsum
            </SidebarItem>
        </SidebarGroup>

    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}

<Modal  title="Delete"
        content="Are you sure you want to delete selected list?"
        icon={FaTrash}
        onOkCallback={deleteList}
        bind:this={deleteModal}
        />

<Modal  title="Archive"
        content="Are you sure you want to archive selected list?"
        icon={FaArchive}
        onOkCallback={archiveList}
        bind:this={archiveModal}
        />

