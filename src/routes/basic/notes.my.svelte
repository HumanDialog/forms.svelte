<script>
    import {
        reef,
        session
    } from '@humandialog/auth.svelte'
    import {
        Spinner,
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
        onErrorShowAlert,
        Breadcrumb,
        Paginator,
        Paper,
        PaperHeader,
        i18n
    } from '$lib'
    import {
        FaPlus,
        FaCaretUp,
        FaCaretDown,
        FaTrash,
        FaList,
        FaPen,
        FaArchive,
        FaChevronLeft,
        FaChevronRight
    } from 'svelte-icons/fa'
    import {
        querystring,
        location,
        push
    } from 'svelte-spa-router'
    import {
        getElementIcon
    } from './icons';
    import NoteProperties from './properties.note.svelte'
    export let params = {}
    let user = null;
    let listComponent;
    let canonicalPath = []
    const title = '_; My notes; Mis notas; Moje notatki'
    let pageNo = 0
    let allPagesNo = 1
    let pageElementsNo = 25
    $: onParamsChanged($session, $mainContentPageReloader, $querystring);
    async function onParamsChanged(...args) {
        if (!$session.isActive) {
            user = null;
            return;
        }
        const params = new URLSearchParams($querystring);
        if (params.has("page"))
            pageNo = parseInt(params.get("page"))
        else
            pageNo = 0
        await fetchData()
        const allElementsNo = user.ModifiedNotesCount
        allPagesNo = Math.floor(allElementsNo / pageElementsNo)
        if (allElementsNo % pageElementsNo)
            allPagesNo += 1
        pageNo = Math.max(0, Math.min(pageNo, allPagesNo - 1))
        paginatorTop ?.updatePageNo(pageNo)
        paginatorTop ?.updateAllPagesNo(allPagesNo)
        paginatorBtt ?.updatePageNo(pageNo)
        paginatorBtt ?.updateAllPagesNo(allPagesNo)
    }
    async function fetchData() {
        if (pageNo < 0)
            pageNo = 0
        const pageOffset = pageNo * pageElementsNo
        let res = await reef.post(`/user/query`, {
                Id: 1,
                Name: "collector",
                ExpandLevel: 3,
                Tree: [{
                    Id: 1,
                    Association: '',
                    Expressions: ['Id', 'Name', 'ModifiedNotesCount'],
                    SubTreeOffset: pageOffset,
                    SubTreeLimit: pageElementsNo,
                    SubTree: [{
                        Id: 2,
                        Association: 'ModifiedNotes',
                        Sort: '-ModificationDate, Id',
                        Expressions: ['Id', 'Title', 'Summary', 'href', 'icon', 'ModificationDate',
                            '$ref', '$type'
                        ]
                    }]
                }]
            },
            onErrorShowAlert);
        if (res)
            user = res.User;
        else
            user = null
        /*canonicalPath = [
            {
                Name: group.Name
            },
            {
                Name: title
            }
        ]*/
    }
    async function reloadNotes(selectRecommendation) {
        await fetchData();
        listComponent.reload(user, selectRecommendation);
    }
    let deleteModal;
    let noteToDelete;

    function askToDelete(note) {
        noteToDelete = note;
        deleteModal.show()
    }
    async function deleteNote() {
        if (!noteToDelete)
            return;
        await reef.get(`/${noteToDelete.$ref}/DeletePermanently`, onErrorShowAlert)
        deleteModal.hide();
        await reloadNotes(listComponent.SELECT_NEXT)
    }
    async function addList(newListAttribs) {
        let res = await reef.post('/user/CreateList', {
                name: newListAttribs.Name,
                order: newListAttribs.Order,
                summary: newListAttribs.Summary
            },
            onErrorShowAlert);
        if (!res)
            return null;
        let newList = res.TaskList;
        await reloadNotes(newList.$ref)
    }
    let pageOperations = {
        opver: 2,
        fab: 'M00',
        tbr: 'D',
        operations: [{
            caption: '_; View; Ver; Widok',
            operations: []
        }]
    }
    let listOperations = (list) => {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                /*     {
                        caption: '_; View; Ver; Widok',
                        operations: [
                            {
                                caption: '_; New list; Nueva lista; Nowa lista',
                                icon: FaList,
                                action: (focused) => { listComponent.addRowAfter(list) },
                                fab: 'M01',
                                tbr: 'A'
                            }
                        ]
                    },
                */
                {
                    caption: '_; List; Lista; Lista',
                    //tbr: 'B',
                    operations: [{
                            caption: '_; Edit...; Editar...; Edytuj...',
                            mricon: 'pencil',
                            fab: 'M20',
                            tbr: 'A',
                            grid: [{
                                    caption: '_; Title; Título; Tytuł',
                                    action: (focused) => {
                                        listComponent.edit(list, 'Title')
                                    }
                                },
                                {
                                    caption: '_; Summary; Resumen; Podsumowanie',
                                    action: (focused) => {
                                        listComponent.edit(list, 'Summary')
                                    }
                                }
                            ]
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            action: (f) => askToDelete(list)
                        },
                        {
                            caption: '_; Properties; Propiedades; Właściwości',
                            action: (btt, rect) => runElementProperties(btt, rect, list, 'Note')
                        }
                    ]
                }
            ]
        }
    }
    let paginatorTop
    let paginatorBtt

    function onPage(page) {
        pageNo = page
        const path = $location
        const loc = `${path}?page=${pageNo}`
        push(loc)
    }
    let notePropertiesDialog;

    function runElementProperties(btt, aroundRect, element, kind) {
        switch (kind) {
            case 'Note':
            case 'FolderNote':
                notePropertiesDialog.show(element)
                break;
        }
    }
    let list_properties = {
        Title: "Title",
        Summary: "Summary",
        icon: "icon",
        element: {
            icon: "icon",
            href: "href",
            Title: "Title",
            Summary: "Summary"
        },
        context: {
            Folder: {
                Summary: "Summary",
            },
            FolderFolder: {
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
    {#key user}
        <Page   self={user}
                toolbarOperations={pageOperations}
                clearsContext='props sel'
                title={title}
                >
            <Paper >

            <PaperHeader>
                <!--Breadcrumb class="mt-1 mb-5" path={canonicalPath}/-->
            </PaperHeader>

            <figure>
            <h1>{title}</h1>
            <figcaption>{i18n(["Recently edited notes", "Notas editadas recientemente", "Ostatnio edytowane notatki"])}</figcaption>
            </figure>



            <List   self={user}
                    a='ModifiedNotes'
                    {list_properties}
                    toolbarOperations={listOperations}
                    bind:this={listComponent}>
                <ListTitle a='Title' hrefFunc={(n) => n.href} />
                <ListSummary a='Summary'/>
                <!--ListInserter action={addList} icon/-->

                <ListDateProperty name='ModificationDate' detailed editable={false}/>

               

            </List>

            <div class="flex flex-row justify-between">
                <span></span>
                <span class="text-center"><Paginator {onPage} {pageNo} {allPagesNo} bind:this={paginatorTop}/></span>
                <span class="pr-5 text-right"> </span>
            </div>

            <div class="flex sm:hidden flex-row mt-10 mb-20">
                <section class="ml-auto mr-2">
                    <Paginator {onPage} {pageNo} {allPagesNo} bind:this={paginatorBtt}/>
                </section>
            </div>



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
        onOkCallback={deleteNote}
        bind:this={deleteModal}
        />

<NoteProperties bind:this={notePropertiesDialog} />