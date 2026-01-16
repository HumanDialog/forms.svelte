<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                Ricon,
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert, i18n, Paper, PaperHeader,
                Breadcrumb} from '$lib'
    import {querystring, location} from 'svelte-spa-router'
    import {FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCalendar, FaRegCalendarCheck, FaPen, FaArchive, FaEllipsisH} from 'svelte-icons/fa'
    import FolderProperties from './properties.folder.svelte'

    export let params = {}

    let user = null;
    let listComponent;

    const title = '_; My Folders; Mis carpetas; Moje foldery'
    let canonicalPath = [];


    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(`/user/query`,
                                {
                                    Id: 1,
                                    Name: "collector",
                                    ExpandLevel: 3,
                                    Tree:
                                    [
                                        {
                                            Id: 1,
                                            Association: '',
                                            Expressions:['Id','Name','login', '$ref', 'href'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'Folders',
                                                    Expressions:['Id','Title', 'Summary', 'href', 'Order', '$ref', 'icon', '$type'],
                                                    Sort: "Order",
                                                }
                                            ]
                                        }
                                    ]
                                },
                                onErrorShowAlert);
        if(res)
            user = res.User;
        else
            user = null

        /*canonicalPath = [
            {
                Name: user.Name,
                href: user.href
            },
            {
                Name: title,
                href: '/myfolders'
            }
        ]*/
    }

    async function reloadFolders(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(user, selectRecommendation);
    }


    let deleteModal;
    let folderToDelete;
    function askToDelete(folder)
    {
        folderToDelete = folder;
        deleteModal.show()
    }


    async function deleteFolder()
    {
        if(!folderToDelete)
            return;

        await reef.post(`${folderToDelete.$ref}/DeletePermanently`, { }, onErrorShowAlert);
        deleteModal.hide();


        await reloadFolders(listComponent.SELECT_NEXT)
    }


    async function addFolder(newFolderAttribs)
    {
        //let res = await reef.post(`/user/Folders/new`, newFolderAttribs, onErrorShowAlert)
        let res = await reef.post("/user/CreateFolder", {
            title: newFolderAttribs.Title,
            order: newFolderAttribs.Order ?? 0,
            summary: newFolderAttribs.Summary ?? ''
        }, onErrorShowAlert)

        if(!res)
            return null;

        let newFolder = res.Folder;
        await reloadFolders(newFolder.$ref)
    }

    let pageOperations = {
        opver: 2,
        fab: 'M00',
        operations: [
            {
                caption: '_; View; Ver; Widok',
                operations: [
                    {
                        caption: '_; New folder; Nueva carpeta; Nowy folder',
                        mricon: 'folder',
                        action: (focused) => { listComponent.addRowAfter(null) },
                        tbr: 'A',
                        fab: 'M03'
                    }
                ]
            }
        ]
    }

    function getEditOperations(folder)
    {
        return [

        ];
    }

    let folderOperations = (folder) => {
        let editOperations = getEditOperations(folder)
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            caption: '_; New folder; Nueva carpeta; Nowy folder',
                            mricon: 'folder',
                            action: (focused) => { listComponent.addRowAfter(folder) },
                            tbr: 'A',
                            fab: 'M03'
                        }
                    ]
                },
                {
                    caption: '_; Folder; Carpeta; Folder',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit; Editar; Edytuj',
                            mricon: 'pencil',
                            tbr: 'A',
                            fab:'M20',
                            grid:[
                                {
                                    caption: '_; Title; Título; Tytuł',
                                    action: (f) =>  { listComponent.edit(folder, 'Title') },
                                },
                                {
                                    caption: '_; Summary; Resumen; Podsumowanie',
                                    action: (f) =>  { listComponent.edit(folder, 'Summary') }
                                }
                            ]

                        },
                        {
                            caption: '_; Move to top ; Mover al principio de la lista; Przesuń na szczyt',
                            hideToolbarCaption: true,
                            mricon: 'chevrons-up',
                            action: (f) => listComponent.moveTop(folder),
                            fab:'M06',
                            tbr:'A',
                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            mricon: 'chevron-up',
                            action: (f) => listComponent.moveUp(folder),
                            fab:'M05',
                            tbr:'A',
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            mricon: 'chevron-down',
                            action: (f) => listComponent.moveDown(folder),
                            fab:'M04',
                            tbr:'A'
                        },

                       {
                            caption: '_; Delete; Eliminar; Usuń',
                            //icon: FaTrash,
                            action: (f) => askToDelete(folder),
                            //fab:'M30',
                            //tbr:'B'
                        },
                        {
                            caption: '_; Properties; Propiedades; Właściwości',
                            action: (btt, rect)=> runElementProperties(btt, rect, folder, 'Folder')
                        }
                    ]
                }
            ]
        }
    }

    /*
    async function copyFolderToBasket(folder)
    {
        await reef.post(`${folder.$ref}/CopyToBasket`, { }, onErrorShowAlert)
        // not needed
        //await reloadFolders(listComponent.SELECT_NEXT)
    }

    async function cutFolderToBasket(folder)
    {
        const res = await reef.post(`${user.$ref}/MoveFolderToBasket`, {folder: folder.$ref}, onErrorShowAlert)
        if(res)
            await reloadFolders(listComponent.SELECT_NEXT)
    }
    */

    let folderPropertiesDialog;
    function runElementProperties(btt, aroundRect, element, kind)
    {
        switch(kind)
        {
        case 'Folder':
        case 'FolderFolder':
            folderPropertiesDialog.show(element)
            break;
        }
    }

    function getFolderIcon(folder)
    {
        if(folder.icon)
        {
            switch(folder.icon)
            {
            case 'Folder':
                return FaRegFolder;
            case 'Clipboard':
                return FaRegClipboard;
            case 'Discussion':
                return FaRegComments;
            default:
                return FaRegFolder
            }
        }
        else
            return FaRegFolder
    }
    let list_properties = {
        Title: "Title",
        Summary: "Summary",
        icon: "icon",
        element:{
            icon: "icon",
            href: "href",
            Title: "Title",
            Summary: "Summary"
        },
        context:{
            Folder:{
                Summary: "Summary",

            },
            FolderFolder:{
                Summary: "Summary",
                head_right: "ModificationDate"
            }
        }
    }

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if user}

<Page   self={user}
        toolbarOperations={pageOperations}
        clearsContext='props sel'
        title={title}>
    <Paper>
        <PaperHeader>
            <!--Breadcrumb class="mt-1 mb-5" path={canonicalPath}/-->
        </PaperHeader>

        <figure>
        <h1>{title}</h1>
        <figcaption>{i18n(["Personal folders", "Carpetas personales", "Foldery osobiste"])}</figcaption>
        </figure>

        <!--div class="flex flex-row justify-between">
            <span></span>
            <span class="text-center"></span>
            <span class="pr-5 text-right"> <Paginator {onPage} {pageNo} {allPagesNo} bind:this={paginatorTop}/></span>
        </div-->



        <List   self={user}
                a='Folders'
                {list_properties}
                toolbarOperations={folderOperations}
                orderAttrib='Order'
                bind:this={listComponent}>
            <ListInserter action={addFolder} icon/>

        </List>

    <!--input hidden type="file" id="attachementFile" accept="*/*"/-->

     </Paper>
    </Page>
{:else}
    <!--Spinner delay={3000}/-->
    <Ricon icon='loader-circle'/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected folder?", "¿Está seguro de que desea eliminar el elemento seleccionado?", "Czy na pewno chcesz usunąć wybrany element?"])}
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />

<FolderProperties bind:this={folderPropertiesDialog} />
