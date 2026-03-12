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
                onErrorShowAlert, Breadcrumb, Paper, PaperHeader,
                i18n, reloadPageToolbarOperations
        } from '$lib'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaList, FaPen, FaArchive, FaChevronLeft, FaChevronRight} from 'svelte-icons/fa'
    import {location, pop, push, querystring, link} from 'svelte-spa-router'

    export let params = {}

    let group = null;
    let listComponent;

    let showArchived = false;
    let contextItemSelector;
    let self_ref;
    let collection_ref;

    let cacheKey;
    let contextPath;
    let contextItemId;
    let canonicalPath = []

    let query_selector = "";

    let title = "";

    $: onParamsChanged($location, $session, $mainContentPageReloader, $querystring);

    const query_params = {
        contexts: {
            default:{
                title: '_; Common lists; Listas comunes; Wspólne listy',
                self: "group",
                collection: "Lists"
            },
            allprojects: {
                title: '_; Active projects; Proyectos activos; Aktywne projekty',
                self: "group",
                collection: "Projects"
            },
            archivedprojects:{
                title: '_; Archived projects; Proyectos archivados; Zarchiwizowane projekty',
                self: "group",
                collection: "ArchivedProjects"
            }
        }
    }

    let query_root = "";
    let query_key = "";

    let query_body = {  Id: 1,
                        Name: "collector",
                        ExpandLevel: 3,
                        Tree:
                        [
                            {
                                Id: 1,
                                Association: '',
                                Expressions:['Id','Name'],
                                SubTree:
                                [
                                    {
                                        Id: 2,
                                        Association: 'Projects',
                                        //Filter: 'State <> STATE_FINISHED',
                                        Sort: "Order",
                                        Expressions: ['Id', 'Title', 'Summary', 'Order', 'href', '$ref' ]
                                    }
                                ]
                            }
                        ]
                    }


    function adjust_query_root()
    {
        console.log('adjust_query_root [a]: ' + query_selector)
        let self = query_params.contexts[query_selector]?.self;



        if(!self)
        {
            query_selector = ''
            return;
        }

        query_root = "/" + self + "/query";
        console.log('adjust_query_root [b]: ' + query_selector + " - " + query_root)

    }

    function adjust_query_body()
    {
        query_body.Tree[0].SubTree[0].Association = query_params.contexts[query_selector]?.collection;
    }

    function adjust_query_key()
    {
        query_key = query_params.contexts[query_selector]?.self + "/" + query_params.contexts[query_selector]?.collection;
    }

    function adjust_other_params()
    {
        title = query_params.contexts[query_selector]?.title;
    }


    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        console.log('onParamsChanged', segments)

        if(!segments.length)
            query_selector = 'default'
        else
            query_selector = segments[segments.length - 1]

        adjust_query_root();
        if(!query_selector)
            return;
        adjust_query_body();
        adjust_query_key();
        adjust_other_params();




        //const cachedValue = cache.get(query_key)
        //if(cachedValue)
        //{
        //    contextItem = cachedValue;
        //    folderTitle = ext(contextItem.Title);
        //    contextItemId = cachedValue.Id;
        //    listComponent?.reload(contextItem, listComponent.KEEP_SELECTION)
        // }
        //---------------------------------------------------
        //const readItem = await readContextItem(self_ref, cacheKey)

        await fetch_items()
    }

    async function fetch_items()
    {

        console.log('projects.svelte fetch_items', query_body)
        console.trace()
        let res = await reef.post(query_root,
                                query_body,
                                onErrorShowAlert);
        if(res)
            group = res.Group;
        else
            group = null

    }

    async function reloadLists(selectRecommendation)
    {
        await fetch_items();
        listComponent.reload(group, selectRecommendation);
    }


    let deleteModal;
    let listToDelete;
    function askToDelete(list)
    {
        listToDelete = list;
        deleteModal.show()
    }


    async function deleteList()
    {
        if(!listToDelete)
            return;

        await reef.delete(`/group/Lists/${listToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();


        await reloadLists(listComponent.SELECT_NEXT)
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

        await reloadLists(listComponent.SELECT_NEXT)
    }


    async function addList(newListAttribs)
    {
        let res = await reef.post('/group/CreateList',
                        {
                            name: newListAttribs.Name,
                            order: newListAttribs.Order,
                            summary: newListAttribs.Summary
                        },
                        onErrorShowAlert);

        if(!res)
            return null;

        let newList = res.TaskList;
        await reloadLists(newList.$ref)
    }


    let pageOperations = {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            icon: FaList,
                            mricon: 'notebook',
                            caption: '_; New list; Nueva lista; Nowa lista',
                            action: (focused) => { listComponent.addRowAfter(null) },
                            fab: 'M01',
                            tbr: 'A'
                        },
                        {
                            mricon: 'file-archive',
                            caption: '_; Show archived lists; Mostrar listas archivadas; Pokaż zarchiwizowane listy',
                            //action: (focused) => { listComponent.addRowAfter(null) },
                            action: (focused) => push('/archivedlists'),
                            fab: 'S01',
                            tbr: 'C'
                        }
                    ]
                }
            ]
        }

    function unfollowOperation(list)
    {
        return {
            caption: '_; Unfollow; Dejar de seguir; Przestań obserwować',
            mricon: 'heart-off',
            tbr: 'C',
            fab: 'S20',
            hideToolbarCaption: true,
            action: async (f) => await toggleSubscribe(list)
        }
    }


    function followOperation(list)
    {
        return {
            caption: '_; Follow; Seguir; Obserwuj',
            mricon: 'heart',
            tbr: 'C',
            fab: 'S20',
            hideToolbarCaption: true,
            action: async (f) => await toggleSubscribe(list)
        }
    }


    let listOperations = (list) => {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                 {
                    caption: '_; File; Archivo; Plik',
                    operations: [
                        {
                            caption: '_; New list; Nueva lista; Nowa lista',
                            icon: FaList,
                            mricon: 'notebook',
                            action: (focused) => { listComponent.addRowAfter(list) },
                            fab: 'M01',
                            tbr: 'A'
                        }
                    ]
                },
                {
                    caption: '_; List; Lista; Lista',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            mricon: 'pencil',
                            fab: 'M20',
                            tbr: 'A',
                            grid: [
                                    {
                                        caption: '_; Title; Título; Tytuł',
                                        action: (focused) =>  { listComponent.edit(list, 'Name') }
                                    },
                                    {
                                        caption: '_; Summary; Resumen; Podsumowanie',
                                        action: (focused) =>  { listComponent.edit(list, 'Summary') }
                                    }
                            ]

                        },
                        {
                            caption: '_; Move to top ; Mover al principio de la lista; Przesuń na szczyt',
                            hideToolbarCaption: true,
                            mricon: 'chevrons-up',
                            action: (f) => listComponent.moveTop(list),
                            fab: 'M06',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            mricon: 'chevron-up',
                            action: (f) => listComponent.moveUp(list),
                            fab: 'M05',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            mricon: 'chevron-down',
                            mricon: 'chevrons-down',
                            action: (f) => listComponent.moveDown(list),
                            fab: 'M04',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Archive; Archivar; Zarchiwizuj',
                            action: (f) => askToArchive(list)
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            action: (f) => askToDelete(list)
                        }

                    ]
                },
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            mricon: 'file-archive',
                            caption: '_; Show archived lists; Mostrar listas archivadas; Pokaż zarchiwizowane listy',
                            //action: (focused) => { listComponent.addRowAfter(null) },
                            fab: 'S01',
                            tbr: 'C'
                        }
                    ]
                }

            ]
        }
    }



    let list_properties = {
        Title: "Title",
        Summary: "Summary",

        element:{
            icon: "#building",
            href: "href",
            Title: "Title",
            Summary: "Summary"
        },

    }

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if group}
    {#key group}

        <Page   self={group}
                toolbarOperations={pageOperations}
                clearsContext='props sel'
                title={title}>
            <Paper class="mb-64">

            <PaperHeader>
                <!--Breadcrumb class="mt-1 mb-5" path={canonicalPath}/-->
            </PaperHeader>

            <figure>
            <h1>{title}</h1>
            <figcaption>{i18n(["Task lists visible to all group members.", "Listas de tareas visibles para todos los miembros del grupo.", "Listy zadań widoczne dla wszystkich członków grupy."])}</figcaption>
            </figure>

            <List   self={group}
                    a='Projects'
                    {list_properties}
                    toolbarOperations={listOperations}
                    orderAttrib='Order'

                    bind:this={listComponent}>

                <ListInserter action={addList} icon/>



            </List>

            <!--div class="ml-3 mt-20 mb-10">
                <a  href={`/alllists?archived`}
                    class="hover:underline"
                    use:link>
                        _; Show archived lists; Mostrar listas archivadas; Pokaż zarchiwizowane listy
                        <div class="inline-block mt-1.5 w-3 h-3"><FaChevronRight/></div>
                </a>
            </div-->

            </Paper>
        </Page>
    {/key}
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected list?", "¿Está seguro de que desea eliminar la list seleccionada?", "Czy na pewno chcesz usunąć wybraną listę?"])}
        icon={FaTrash}
        onOkCallback={deleteList}
        bind:this={deleteModal}
        />

<Modal  title={i18n(['Archive', 'Archivar', 'Zarchiwizuj'])}
        content={i18n(["Are you sure you want to archive selected list?", "¿Está seguro de que desea archivar la lista seleccionada?", "Czy na pewno chcesz zarchiwizować wybraną listę?"])}
        icon={FaArchive}
        onOkCallback={archiveList}
        bind:this={archiveModal}
        />