<script>
    import {    Spinner,
                startEditing,
                SidebarGroup,
                SidebarList,
                SidebarItem,
                PaperNav,
                reloadMainContentPage,
                Modal,
                reloadWholeApp,
                Input,
                onErrorShowAlert, UI, i18n, ext} from '$lib'
    import {FaRegFolder, FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive, FaUsers, FaPlus, FaRegStar, FaStar, FaPaste, FaRegClipboard, FaRegComments, FaRegFile, FaRegCalendar, FaRegCalendarCheck} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount, tick } from 'svelte';
    import { cache} from './cache.js'
    import {getElementIcon} from './icons'

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
                                        Expressions:['Id','$ref', 'Title', 'href', 'Summary', 'Order', '$type'],
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


    async function addFolder(folderName, order)
    {
        await reef.post("/group/Folders/new",
                            {
                                Title: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
        reloadGroupFolders();
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



    export function requestAdd()
    {
        navGroupFolders.add(async (folderName, order) => {
            await reef.post("/group/Folders/new",
                            {
                                Title: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
            reloadGroupFolders();
        })
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
                caption: '_; Summary; Resumen; Podsumowanie',
                action: (f) => navItem.editSummary()
            },
            {
                caption: 'Move on top',
                action: (f) => navGroupFolders.moveTop(dataItem)
            },
            {
                caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                mricon: 'chevron-up',
                action: (f) => navGroupFolders.moveUp(dataItem)
            },
            {
                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                mricon: 'chevron-down',
                action: (f) => navGroupFolders.moveDown(dataItem)

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

    function getPinnedFolderOperations(domNode, dataItem, navItem)
    {
        return [
            {
                caption: '_; Unpin; Desanclar; Odepnij',
                icon: FaRegStar,
                action: (f) => unpinFolder(dataItem)
            },
            {
                caption: '_; Move up; Desplazar hacia arriba; Przesuń w górę',
                mricon: 'chevron-up',
                action: (f) => navPinnedElements.moveUp(dataItem)
            },
            {
                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                mricon: 'chevron-down',
                action: (f) => navPinnedElements.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: '_; Rename; Editar nombre; Edytuj nazwę',
                action: (f) => startEditing(domNode)
            },
            {
                caption: '_; Summary; Resumen; Podsumowanie',
                action: (f) => navItem.editSummary()
            },
            {
                separator: true
            },
            {
                caption: '_; Delete; Eliminar; Usuń',
                action: (f) => askToDelete(dataItem, 'PinnedFolder')
            }
        ]
    }

    function getGroupFolderOperations(domNode, dataItem, navItem)
    {
        return [
            {
                caption: '_; Move up; Desplazar hacia arriba; Przesuń w górę',
                mricon: 'chevron-up',
                action: (f) => navGroupFolders.moveUp(dataItem)
            },
            {
                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                mricon: 'chevron-down',
                action: (f) => navGroupFolders.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: '_; Rename; Editar nombre; Edytuj nazwę',
                action: (f) => startEditing(domNode)
            },
            {
                caption: '_; Summary; Resumen; Podsumowanie',
                action: (f) => navItem.editSummary()
            },
            {
                separator: true
            },
            {
                caption: '_; Delete; Eliminar; Usuń',
                action: (f) => askToDelete(dataItem, 'GroupFolder')
            }
        ]
    }

    function getMyFoldersOperations(domNode, dataItem)
    {
        return []
    }

    function getBasketOperations(domNode, dataItem)
    {
        return [
            {
                caption: '_; Clear Clipboard; Borrar portapapeles; Wyczyść schowek',
                icon: FaTrash,
                action: (f) => clearFolder(dataItem)
            }];;
    }

    async function clearFolder(folder)
    {
        await reef.post(`${folder.$ref}/DettachAllContent`, {} , onErrorShowAlert)
    }

    async function unpinFolder(folder)
    {
        await reef.post(`${folder.$ref}/TogglePinned`, {}, onErrorShowAlert)
        reloadPinnedFolders();
    }


    let deleteModal;
    let folderToDelete;
    let deleteFolderKind=''
    function askToDelete(folder, kind)
    {
        folderToDelete = folder;
        deleteFolderKind = kind;
        deleteModal.show()
    }

    async function deleteFolder()
    {
        if(!folderToDelete)
            return;

        await reef.post(`${folderToDelete.$ref}/DeletePermanently`, { },  onErrorShowAlert)
        deleteModal.hide();

        switch(deleteFolderKind)
        {
        case 'GroupFolder':
            reloadGroupFolders();
            break;

        case 'PinnedFolder':
            reloadPinnedFolders();
        }

    }

    async function changeName(folder, name)
    {
        let res = await reef.post(`${folder.$ref}/set`,
                                {
                                    Title: name
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function changeSummary(folder, summary)
    {

        let res = await reef.post(`${folder.$ref}/set`,
                                {
                                    Summary: summary
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    const mynotes_selection = {}

</script>

{#key currentPath}
<PaperNav>
{#if true}
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
                                            icon = 'file-text'
                                            bind:this={navPinnedItems[idx]}
                                            active={isRoutingTo(href, currentPath)}
                                            summary={ext(item.Summary)}>
                                {ext(item.Title)}
                            </SidebarItem>
                        </svelte:fragment>
                    </SidebarList>
                </SidebarGroup>
            {/if}

            <SidebarGroup border>
                <SidebarItem   href="/mynotes"
                                icon = 'file-text'
                                active={isRoutingTo("/mynotes", currentPath)}
                                summary={i18n(["Recently edited notes", "Notas editadas recientemente", "Ostatnio edytowane notatki"])}
                                selectable={mynotes_selection}>
                    _; My notes; Mis notas; Moje notatki
                </SidebarItem>
            </SidebarGroup>

            <SidebarGroup title={i18n({en: 'Personal', es: 'Personales', pl: 'Osobiste'})}>
                <SidebarItem   href="/myfolders"
                                icon = 'folder'
                                active={isRoutingTo("/myfolders", currentPath)}
                                summary={i18n(["Personal folders", "Carpetas personales", "Foldery osobiste"])}>
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
                                    summary={ext(item.Summary)}>
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

{:else} <!-- !sidebar -->

    {#if groupFolders && groupFolders.length > 0}

        {#if $session.isActive}
            {#if pinnedElements && pinnedElements.length > 0}
                <p>##sidebar</p>
                <SidebarGroup   title={i18n({en: 'Pinned', es: 'Sujetado', pl: 'Przypięte'})}
                                moreHref={user.PinnedFolders.href}>
                    <SidebarList    objects={pinnedElements}
                                    orderAttrib='Order'
                                    bind:this={navPinnedElements}>
                        <svelte:fragment let:item let:idx>
                            {@const href = item.href}
                            <SidebarItem   {href}
                                            icon={getElementIcon(item)}
                                            bind:this={navPinnedItems[idx]}
                                            {item}
                                            summary={ext(item.Summary)}>
                                {ext(item.Title)}
                            </SidebarItem>
                        </svelte:fragment>
                    </SidebarList>
                </SidebarGroup>
            {/if}


            <SidebarGroup border>
                <SidebarItem    href="/mynotes"
                                icon={getElementIcon("Note")}
                                summary={i18n(["Recently edited notes", "Notas editadas recientemente", "Ostatnio edytowane notatki"])}
                                item={mynotes_selection}>
                    _; My notes; Mis notas; Moje notatki
                </SidebarItem>
            </SidebarGroup>


            <SidebarGroup title={i18n({en: 'Personal', es: 'Personales', pl: 'Osobiste'})}>
                <SidebarItem    href="/myfolders"
                                icon={getElementIcon("Folder")}
                                summary={i18n(["Personal folders", "Carpetas personales", "Foldery osobiste"])}
                                item={user}>
                    _; My Folders; Mis carpetas; Moje Foldery
                </SidebarItem>
            </SidebarGroup>
        {/if}

        <SidebarGroup title={i18n({en: 'Common', es: 'Comunes', pl: 'Wspólne'})}
                        moreHref="/group-folders">
            <SidebarList    objects={groupFolders}
                            orderAttrib='Order'
                            bind:this={navGroupFolders}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaRegFolder}
                                    bind:this={navGroupItems[idx]}
                                    {item}
                                    summary={ext(item.Summary)}>
                        {ext(item.Title)}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList>
        </SidebarGroup>

        <!-- przeniesione do menu aplikacji (tam gdzie Sign out)-->
        <!--SidebarGroup border>
            {@const href = `/folder/${basket.Id}`}
            <SidebarItem    {href}
                            icon={FaPaste}
                            operations={(node) => getBasketOperations(node, basket)}
                            summary="List of selected items for quick operations"
                            item={basket}>
                My Clipboard
            </SidebarItem>
        </SidebarGroup-->


    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}
</PaperNav>
{/key}

<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected folder?", "¿Está seguro de que desea eliminar la carpeta seleccionada?", "Czy na pewno chcesz usunąć wybrany folder?"])}
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />
