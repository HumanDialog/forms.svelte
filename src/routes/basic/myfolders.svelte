<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert, i18n,
                breadcrumbAdd, Breadcrumb} from '$lib'
    import {querystring, location} from 'svelte-spa-router'
    import {FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCalendar, FaPen, FaArchive, FaEllipsisH, FaCopy, FaCut} from 'svelte-icons/fa'

    export let params = {}

    let user = null;
    let listComponent;

    let prevBreadcrumbPath = ''
    let breadcrumbPath = ''
    const title = '_; My Folders; Mis carpetas; Moje foldery'


    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        const params = new URLSearchParams($querystring);
        if(params.has("path"))
            prevBreadcrumbPath = params.get("path") ?? ''
        else
            prevBreadcrumbPath = ''

        breadcrumbPath = breadcrumbAdd(prevBreadcrumbPath, title, $location)

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
                                            Expressions:['Id','Name','login', '$ref'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'Folders',
                                                    Expressions:['Id','Title', 'Summary', 'href', 'Order', '$ref'],
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
        let res = await reef.post(`/user/Folders/new`, newFolderAttribs, onErrorShowAlert)
        if(!res)
            return null;

        let newFolder = res.Folder[0];
        await reloadFolders(newFolder.Id)
    }

    let pageOperations = {
        opver: 2,
        fab: 'M00',
        operations: [
            {
                caption: '_; View; Ver; Widok',
                operations: [
                    {
                        icon: FaPlus,
                        caption: '_; New personal folder; Nueva carpeta personal; Nowy folder osobisty',
                        //hideToolbarCaption: true,
                        action: (focused) => { listComponent.addRowAfter(null) },
                        fab: 'M01',
                        tbr: 'A'
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
            tbr: 'C',
            operations: [
                {
                    caption: '_; Folder; Carpeta; Folder',
                    //tbr: 'B',
                    operations: [

                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            icon: FaCaretUp,
                            action: (f) => listComponent.moveUp(folder),
                            fab:'M03',
                            tbr:'A'
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            icon: FaCaretDown,
                            action: (f) => listComponent.moveDown(folder),
                            fab:'M02',
                            tbr:'A'
                        },
                        {
                            caption: '_; Edit name; Editar nombre; Edytuj nazwę',
                            icon: FaPen,
                            fab: 'M20',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) =>  { listComponent.edit(folder, 'Title') }
                        },
                        {
                            caption: '_; Edit summary; Editar resumen; Edytuj podsumowanie',
                            action: (f) =>  { listComponent.edit(folder, 'Summary') }
                        },
                    /*    {
                            icon: FaCopy,   // MdLibraryAdd
                            caption: 'Copy to Clipboard',
                            action: (f) => copyFolderToBasket(folder),
                        //    fab: 'M04',
                            tbr: 'A'
                        },
                        {
                            icon: FaCut,
                            caption: '_; Move to Clipboard; Mover al portapapeles; Przenieś do schowka',
                            action: (f) => cutFolderToBasket(folder),
                        //    fab: 'M05',
                            tbr: 'A'
                        },
                    */    {
                            caption: '_; Delete; Eliminar; Usuń',
                            //icon: FaTrash,
                            action: (f) => askToDelete(folder),
                            //fab:'M30',
                            //tbr:'B'
                        },
                        {
                            icon: FaPlus,
                            caption: '_; New personal folder; Nueva carpeta personal; Nowy folder osobisty',
                            hideToolbarCaption: true,
                            action: (focused) => { listComponent.addRowAfter(folder) },
                            //fab: 'M10',
                            tbr: 'A'
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

    

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if user}

    <Page   self={user}
            toolbarOperations={pageOperations}
            clearsContext='props sel'
            title={title}>
            <section class="w-full place-self-center max-w-3xl">

        {#if breadcrumbPath}
                <Breadcrumb class="hidden sm:block mb-5" path={breadcrumbPath} />
            {/if}


            <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">
                {title}
            </p>

        <List   self={user}
                a='Folders'
                toolbarOperations={folderOperations}
                orderAttrib='Order'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(folder) => `${folder.href}?path=${breadcrumbPath}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addFolder} icon/>

            <span slot="left" let:element>
                <Icon component={FaRegFolder}
                    class="h-5 w-5  text-stone-500 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>
            </span>

        </List>
    </section>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected folder?", "¿Está seguro de que desea eliminar el elemento seleccionado?", "Czy na pewno chcesz usunąć wybrany element?"])}
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />
