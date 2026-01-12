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
                randomString, UI, i18n, ext, isDeviceSmallerThan} from '$lib'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive, FaUsers, FaPlus, FaCalendarDay, FaUserFriends, FaRegCalendar} from 'svelte-icons/fa'
    import {location, push, link} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { afterUpdate, onMount, tick } from 'svelte';
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

    async function addList(listName, order)
    {
        await reef.post('/group/CreateList',
                        {
                            Name: listName,
                            Order: order
                        },
                        onErrorShowAlert);
        reload();
    }

    async function changeName(list, name)
    {
        let res = await reef.post(`/group/Lists/${list.Id}/set`,
                                {
                                    Name: name
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function changeSummary(list, summary, navItem)
    {
        list.Summary = summary
        navItem.updateSummary(summary)
        let res = await reef.post(`/group/Lists/${list.Id}/set`,
                                {
                                    Summary: summary
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function finishAllOnList(list)
    {
        await reef.post(`/group/Lists/${list.Id}/FinishAll`, {}, onErrorShowAlert)

        if( isRoutingTo(`/listboard/${list.Id}`, currentPath) ||
            isRoutingTo(`/tasklist/${list.Id}`, currentPath))
        {
            reloadMainContentPage();
        }
    }

    async function finishAllMyTasks()
    {
        await reef.post(`/user/FinishTasks`, {}, onErrorShowAlert)

        if(isRoutingTo('/mytasks', currentPath))
        {
            reloadMainContentPage();
        }

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


    function getUserListOperations(domNode, dataItem)
    {
        let menuOperations = [];
        if(dataItem == user)
            menuOperations.push({
                caption: '_; Finish all; Completa todos; Ukończ wszystkie',
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
                caption: '_; Rename; Editar nombre; Edytuj nazwę',
                action: (f) => startEditing(domNode)
            },
            {
                caption: '_; Summary; Resumen; Podsumowanie',
                action: (f) => navItem.editSummary()
            },
            {
                caption: '_; Finish all; Completa todos; Ukończ wszystkie',
                action: (f) => finishAllOnList(dataItem)
            },
            {
                caption: '_; Move on top; Mover a la parte superior; Przesuń na szczyt',
                action: (f) => navGroupLists.moveTop(dataItem)
            },
            {
                caption: '_; Move up; Desplazar hacia arriba; Przesuń w górę',
                mricon: 'chevron-up',
                action: (f) => navGroupLists.moveUp(dataItem)
            },
            {
                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                mricon: 'chevron-down',
                action: (f) => navGroupLists.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: '_; Archive; Archivar; Zarchiwizuj',
                action: (f) => askToArchive(dataItem)
            },
            {
                caption: '_; Delete; Eliminar; Usuń',
                action: (f) => askToDelete(dataItem)
            }
        ]
        return menuOperations
    }

    let archivedLists = []
    let navArchivedLists;
    async function onExpandArchived()
    {
        let res = await reef.get("/group/AllLists?sort=-Id&fields=Id,Name,$type&Status=TLS_GROUP_ARCHVIVED_LIST", onErrorShowAlert);
        if(res != null)
        {
            archivedLists = res.TaskList;
            navArchivedLists.reload(archivedLists)

        }
        else
            archivedLists = [];
    }

    export function requestAdd()
    {
        navGroupLists.add(async (listName, order) => {
            await addList(listName, order)
        })
    }

    let showGroupsSwitchMenu = false;
    let canAddNewGroup = false;
    let currentGroup = {}

    const myday = {}
    const teamday = {}

</script>

{#key currentPath}
<div class="w-full prose prose-base prose-zinc dark:prose-invert prose-a:no-underline ">
{#if true}
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

{:else} <!-- !sidebar -->

    {#if groupTaskLists && groupTaskLists.length > 0}

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
            <SidebarGroup border title={i18n({en: 'Current work', es: 'Trabajo actual', pl: 'Bieżąca praca'})}>
                <SidebarItem    href="/myday"
                                icon={FaCalendarDay}
                                item={myday}>
                    _; My day; Mi día; Mój dzień M
                </SidebarItem>
                <SidebarItem    href="/teamday"
                                icon={FaUserFriends}
                                item={teamday}>
                    _; Common work; Trabajo común; Wspólna praca
                </SidebarItem>
                <SidebarItem    href="/mytasks"
                                icon={FaRegCalendar}
                                item={user}> <!-- summary={i18n(["All active tasks assigned to me", "Tareas activas asignadas a mí", "Aktywne zadania przypisane do mnie"])} -->
                    _; Assigned to me; Asignado a mí; Przydzielone do mnie
                </SidebarItem>
            </SidebarGroup>

            <SidebarGroup title={i18n({en: 'My lists', es: 'Mis listas', pl: 'Moje listy%%'})}
                            moreHref="/mylists">

                <SidebarList    objects={userTaskLists}
                                orderAttrib='Order'
                                bind:this={navUserLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={FaList}
                                        {item}
                                        summary={ext(item.Summary)}>
                            {ext(item.Name)}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>
            </SidebarGroup>
        {/if}

        <SidebarGroup title={i18n({en: 'Common lists', es: 'Listas comunes', pl: 'Wspólne listy'})}
                        moreHref="/alllists">

            <SidebarList    objects={groupTaskLists}
                            orderAttrib='Order'
                            bind:this={navGroupLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    {item}
                                    summary={ext(item.Summary)}>
                        {ext(item.Name)}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList>
        </SidebarGroup>

    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}
</div>
{/key}

<!--Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected list?", '¿Está seguro de que desea eliminar la lista seleccionada?', 'Czy na pewno chcesz usunąć wybraną listę?'])}
        icon={FaTrash}
        onOkCallback={deleteList}
        bind:this={deleteModal}
        />

<Modal  title={i18n(['Archive', 'Archivar', 'Zarchiwizuj'])}
        content={i18n(["Are you sure you want to archive selected list?", '¿Está seguro de que desea archivar la lista seleccionada?', 'Czy na pewno chcesz zarchiwizować wybraną listę?'])}
        icon={FaArchive}
        onOkCallback={archiveList}
        bind:this={archiveModal}
        /-->
