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
    import {querystring, pop, link} from 'svelte-spa-router'

    export let params = {}

    let group = null;
    let listComponent;
    let showArchived = false;
    let canonicalPath = []
    const title = '_; Common lists; Listas comunes; Wspólne listy'

    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            group = null;
            return;
        }

        const params = new URLSearchParams($querystring);
        showArchived = params.has('archived')

        await fetchData()
    }

    async function fetchData()
    {
        if(!showArchived)
        {
            let res = await reef.post(`/group/query`,
                                    {
                                        Id: 1,
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
                                                        Association: 'Lists',
                                                        //Filter: 'State <> STATE_FINISHED',
                                                        Sort: "Order",
                                                        Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref', 'IsSubscribed']
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    onErrorShowAlert);
            if(res)
                group = res.Group;
            else
                group = null
        }
        else
        {
            let res = await reef.post(`/group/query`,
                                    {
                                        Id: 1,
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
                                                        Association: 'AllLists',
                                                        Filter: 'Status=TLS_GROUP_ARCHVIVED_LIST',
                                                        Sort: "-Id",
                                                        Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref']
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    onErrorShowAlert);
            if(res)
                group = res.Group;
            else
                group = null
        }

        /*canonicalPath = [
            {
                Name: group.Name
            },
            {
                Name: title
            }
        ]*/

    }

    async function reloadLists(selectRecommendation)
    {
        await fetchData();
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
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if group}
    {#key group}
    {#if !showArchived}
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
    {:else}
        <Page   self={group}
                toolbarOperations={[]}
                clearsContext='props sel'
                title={title}>
                <Paper class="mb-64">
                <section class="w-full place-self-center max-w-3xl">
            <List   self={group}
                    a='AllLists'
                    {list_properties}
                    orderAttrib='Order'
                    bind:this={listComponent}>
                <ListTitle a='Name' hrefFunc={(list) => `/tasklist/${list.Id}?archivedList`} />
                <ListSummary a='Summary'/>
                <!--ListInserter action={addList} icon/-->

            
            </List>

            <div class="ml-3 mt-20 mb-10">
                <button on:click={(e) => pop() }>
                    <div class="inline-block mt-1.5 w-3 h-3"><FaChevronLeft/></div>
                    _; Back; Volver; Wróć
                </button>
            </div>
        </section>
        </Paper>

        </Page>
    {/if}
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