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
                Editable,
                focusEditable,
                onErrorShowAlert, Breadcrumb, Paper, PaperHeader,
                i18n, ext, reloadPageToolbarOperations,
                query_item_collection
        } from '$lib'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaList, FaPen, FaArchive, FaChevronLeft, FaChevronRight} from 'svelte-icons/fa'
    import {location, pop, push, querystring, link} from 'svelte-spa-router'

    export let params = {}

    let self = null;
    let context = null;
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
    let query_id = 0;

    let title = "";

    $: onParamsChanged($location, $session, $mainContentPageReloader, $querystring);

    const group_expressions = ['Id', '$type', 'Name'];
    const project_expressions = ['Id','$type','Title'];
    const task_list_expressions = ['Id', '$type', 'Name', 'Summary', 'Order', 'href', '$ref', 'IsSubscribed'];

    const query_params = {
        contexts: {
            default:{
                title: '_; Common lists; Listas comunes; Wspólne listy',
                summary: "__;en: Task lists visible to all group members;es: Listas de tareas visibles para todos los miembros del grupo.;pl: Listy zadań widoczne dla wszystkich członków grupy.",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "Lists",
                element_expressions: task_list_expressions
            },
            alllists: {
                title: '_; Common lists; Listas comunes; Wspólne listy',
                summary: "__;en: Task lists visible to all group members;es: Listas de tareas visibles para todos los miembros del grupo.;pl: Listy zadań widoczne dla wszystkich członków grupy.",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "Lists",
                element_expressions: task_list_expressions
            },
            archivedlists:{
                title: '_; Archived lists; Listas comunes; Zarchiwizowane listy',
                summary: "__;en: Archived lists visible to all group members;es: Listas comunes de tareas visibles para todos los miembros del grupo.;pl: Zarchiwizowane listy zadań widoczne dla wszystkich członków grupy.",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "ArchivedLists",
                element_expressions: task_list_expressions
            },
            listtemplates:{
                title: '_; Archived lists; Listas comunes; Zarchiwizowane listy',
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "TemplateLists",
                element_expressions: task_list_expressions
            },
            project:{
                stitle: 'Title',
                ssummary: 'Summary',
                self: "Project", use_id: true,
                self_type: 'Project',
                self_expressions: project_expressions,
                collection: "Lists",
                element_expressions: task_list_expressions
            }
        }
    }

    let query_root = "";
    let query_key = "";


    let query_body = {}

    function select_context()
    {
        const segments = $location.split('/');

        if(!segments.length)
            query_selector = 'default'
        else
            query_selector = segments[1];

        context = query_params.contexts[query_selector];
        if(!context)
        {
            query_selector = 'default'
            context = query_params.contexts[query_selector];
            return;
        }

        if(!context.use_id)
            return;

        if(segments.length > 2)
            query_id = parseInt(segments[2]);

        if(query_id <= 0)
        {
            query_selector = 'default'
            context = query_params.contexts[query_selector];
        }
    }

    function adjust_query_root()
    {
        console.log('adjust_query_root [a]: ' + query_selector)
        let self = context.self;

        if(!context.use_id)
            query_root = "/" + context.self + "/query";
        else
            query_root = "/" + context.self + "/" + query_id + "/query";

        console.log('adjust_query_root [b]: ' + query_selector + " - " + query_root)
    }

    function adjust_query_body()
    {

        query_body = query_item_collection( context.self_expressions,
                                                context.collection,
                                                context.element_expressions);

        console.log('query body: ', query_body);
    }

    function adjust_query_key()
    {
        query_key = context.self + "/" + context.collection;
    }

    function adjust_other_params()
    {
        title = context.title;
    }


    async function onParamsChanged(...args)
    {
        console.log('onParamsChanged')
        select_context()

        adjust_query_root();
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
        let res = await reef.post(query_root,
                                query_body,
                                onErrorShowAlert);
        if(res)
            self = res[context.self_type];
        else
            self = null

    }

    async function reloadLists(selectRecommendation)
    {
        await fetch_items();
        listComponent.reload(self, selectRecommendation);
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

    async function toggleSubscribe(list)
    {
        if(list.IsSubscribed)
        {
            const res = await reef.get(`${list.$ref}/Unsubscribe`, onErrorShowAlert)
            if(res)
                list.IsSubscribed = false
        }
        else
        {
            const res = await reef.get(`${list.$ref}/Subscribe`, onErrorShowAlert)
            if(res)
                list.IsSubscribed = true
        }

        const newOperations = listOperations(list)
        reloadPageToolbarOperations(newOperations, true)
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
                        ... list.IsSubscribed? [unfollowOperation(list)] : [followOperation(list)],
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
            icon: "#notebook",
            href: "href",
            Title: "Name",
            Summary: "Summary"
        },

    }

</script>

<svelte:head>
    <title>{ext(title)} | {__APP_TITLE__}</title>
</svelte:head>

{#if self}
    {#key self}

        <Page   self={self}
                toolbarOperations={pageOperations}
                clearsContext='props sel'
                title={title}>
            <Paper class="mb-64">

            <PaperHeader>
                <!--Breadcrumb class="mt-1 mb-5" path={canonicalPath}/-->
            </PaperHeader>
            <!--
            {#if true}
                <h1><Editable self={contextItem} a='Title'/></h1>

                <p class="lead">
                    <Editable self={contextItem} a='Summary'/>
                </p>

            {:else}
                <h1>
                    {ext(contextItem.Title)}
                </h1>
                {#if contextItem.Summary}
                    <p class="lead">
                        {ext(contextItem.Summary)}
                    </p>
                {/if}
            {/if}-->

            <figure>
                    {#if context.title}
            <h1>{ext(context.title)}</h1>
                    {:else if context.stitle}
            <h1><Editable self={self} a={context.stitle}/></h1>
                    {/if}

                    {#if context.summary}
            <figcaption>{ext(context.summary)}</figcaption>
                    {:else if context.ssummary}
            <figcaption><Editable self={self} a={context.ssummary}/></figcaption>
                    {/if}

            </figure>

            <List   self={self}
                    a='Lists'
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