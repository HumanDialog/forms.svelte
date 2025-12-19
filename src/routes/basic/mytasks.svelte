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
                onErrorShowAlert,
                Breadcrumb, Paper, Paginator,
            i18n} from '$lib'
    import {FaCheck, FaCaretUp, FaCaretDown, FaTrash, FaRegCalendarCheck, FaRegCalendar, FaPen, FaArchive, FaUndo} from 'svelte-icons/fa'
    import {setBrowserRecentElement} from './basket.utils'
    import TaskProperties from './properties.task.svelte'
    import {querystring, location, push} from 'svelte-spa-router'

    export let params = {}

    //let pageNo = 0
    //let allPagesNo = 1
    //let pageElementsNo = 25

    let user = null;
    let listComponent;

    let lists = [];
    const STATE_FINISHED = 7000;
    let canconicalPath = []
    const title = '_; My tasks; Mis tareas; Moje zadania'

    $: onParamsChanged($session, $mainContentPageReloader/*, $querystring*/);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        if(lists.length == 0)
            reef.get('/group/Lists', onErrorShowAlert).then( (res) => { if(res) lists=res.TaskList} );
        
        //const params = new URLSearchParams($querystring);
        //if(params.has("page"))
        //    pageNo = parseInt(params.get("page"))
        //else
        //    pageNo = 0

        await fetchData()

        //const allElementsNo = user.AssignedTasksCount
        //allPagesNo = Math.floor(allElementsNo / pageElementsNo)
        //if(allElementsNo % pageElementsNo)
        //    allPagesNo += 1

        //pageNo = Math.max(0, Math.min(pageNo, allPagesNo-1))

        //paginatorTop?.updateParams(pageNo, allPagesNo)
        //paginatorBtt?.updateParams(pageNo, allPagesNo)

        //if(listComponent)
        //    listComponent.reload(user, listComponent.KEEP_SELECTION)
    }

    async function fetchData()
    {
        //if(pageNo < 0)
        //    pageNo = 0
        //const pageOffset = pageNo * pageElementsNo

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
                                            Expressions:['Id','Name', 'href', 'AssignedTasksCount'],
                                        //    SubTreeOffset: pageOffset,
                                        //    SubTreeLimit: pageElementsNo,
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'MyTasks',
                                                    Filter: 'State <> STATE_FINISHED',
                                                    Sort: "UserOrder",
                                                    SubTree:[
                                                        {
                                                            Id: 3,
                                                            Association: 'Actor',
                                                            Expressions:['$ref', 'Name']
                                                        },
                                                        {
                                                            Id: 4,
                                                            Association: 'TaskList',
                                                            Expressions:['$ref', 'Name']
                                                        }
                                                    ]
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

        /*canconicalPath = [
            {
                Name: user.Name,
                href: user.href
            },
            {
                Name: title
            }
        ]*/
    }

    async function reloadTasks(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(user, selectRecommendation);
    }


    let deleteModal;
    let taskToDelete;
    function askToDelete(task)
    {
        taskToDelete = task;
        deleteModal.show()
    }


    async function deleteTask()
    {
        if(!taskToDelete)
            return;

        //await reef.delete(taskToDelete.$ref, onErrorShowAlert);
        await reef.post(`${taskToDelete.$ref}/DeletePermanently`, { } , onErrorShowAlert);
        deleteModal.hide();


        await reloadTasks(listComponent.SELECT_NEXT)
    }

    let archiveModal;
    let taskToArchive;
    function askToArchive(task)
    {
        taskToArchive = task;
        archiveModal.show();
    }

    async function archiveTask()
    {
        if(!taskToArchive)
            return;

        await reef.post(`${taskToArchive.$ref}/Archive`, {}, onErrorShowAlert)
        archiveModal.hide();

        await reloadTasks(listComponent.SELECT_NEXT)
    }

    let finishRequested = []
    let finishTimer = 0

    function isFinishRequested(task)
    {
        const idx = finishRequested.findIndex((t) =>  t == task.$ref)
        return idx >= 0 
    }

    function requestFinish(task)
    {
        if(!isFinishRequested(task))
        {
            finishRequested.push(task.$ref)
        }

        setupFinishingTimer()
    }

    function undoRequestFinish(task)
    {
        const idx = finishRequested.findIndex((t) => t == task.$ref)
        if(idx >= 0)
        {
            finishRequested.splice(idx, 1)
        }
        
        setupFinishingTimer()
    }

    async function executeFinishingRequestedTasks()
    {
        let promises = []
        finishRequested.forEach( $ref => 
            promises.push( reef.post(`${$ref}/Finish`, {}, onErrorShowAlert))
        )

        finishRequested = []

        await Promise.all(promises)
        await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)
        
    }

    function setupFinishingTimer()
    {
        if(finishTimer > 0)
            clearTimeout(finishTimer)

        finishTimer = setTimeout(executeFinishingRequestedTasks, 5000)
    }

    async function finishTask(event, task)
    {
        if(event)
            event.stopPropagation();

        requestFinish(task)
        listComponent.rereder()
    }

    async function undoFinishTask(event, task)
    {
        if(event)
            event.stopPropagation();

        undoRequestFinish(task)
        listComponent.rereder()
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post('/user/CreateMyTask', newTaskAttribs, onErrorShowAlert)
        //let res = await reef.post(`/user/MyTasks/new`, newTaskAttribs, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.Task;
        setBrowserRecentElement(newTask.Id, 'Task')

        await reloadTasks(newTask.Id)
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
                            icon: FaRegCalendar,
                            caption: '_; New task; Nueva tarea; Nowe zadanie',
                            action: (focused) => { listComponent.addRowAfter(null) },
                            fab: 'M01',
                            tbr: 'A'
                        }
                    ]
                }
            ]
        }

    let taskOperations = (task) => {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            caption: '_; New task; Nueva tarea; Nowe zadanie',
                            icon: FaRegCalendar,
                            action: (focused) => { listComponent.addRowAfter(task) },
                            fab: 'M01',
                            tbr: 'A'
                        }
                    ]
                },
                {
                    caption: '_; Task; Tarea; Zadanie',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            fab: 'M20',
                            tbr: 'A',
                            grid: [
                                    {
                                        caption: '_; Title; Título; Tytuł',
                                        action: (focused) =>  { listComponent.edit(task, 'Title') }
                                    },
                                    {
                                        caption: '_; Summary; Resumen; Podsumowanie',
                                        action: (focused) =>  { listComponent.edit(task, 'Summary') }
                                    },
                                    {
                                        separator: true
                                    },
                                    {
                                        caption: '_; List; Lista; Lista',
                                        action: (focused) => { listComponent.edit(task, 'TaskList') }
                                    },
                                    {
                                        caption: '_; Due Date; Fecha; Termin',
                                        action: (focused) => { listComponent.edit(task, 'DueDate') }
                                    }
                            ]

                        },
                        ... ((task.State == STATE_FINISHED) || isFinishRequested(task)) ? [
                            {
                                caption: '_; Undo finish; Retroceder final; Cofnij zakończenie',
                                icon: FaUndo,
                                action: (f) => undoFinishTask(undefined, task),
                                fab: 'M03',
                                tbr: 'A'
                            }
                        ] : [
                            {
                                caption: '_; Finish; Finalizar; Zakończ',
                                icon: FaCheck,
                                action: (f) => finishTask(undefined, task),
                                fab: 'M03',
                                tbr: 'A'
                            }
                        ],
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            icon: FaCaretUp,
                            action: (f) => listComponent.moveUp(task),
                            fab: 'M05',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            icon: FaCaretDown,
                            action: (f) => listComponent.moveDown(task),
                            fab: 'M04',
                            tbr: 'A'
                        },

                         {
                            caption: '_; Archive; Archivar; Zarchiwizuj',
                            action: (f) => askToArchive(task)
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            action: (f) => askToDelete(task)
                        },
                        {
                            caption: '_; Properties; Propiedades; Właściwości',
                            action: (btt, rect)=> runElementProperties(btt, rect, task, 'Task')
                        }

                    ]
                }
            ]
        }
    }

    //let paginatorTop
    //let paginatorBtt
    //function onPage(page)
    //{
    //    pageNo = page
    //
    //    const path = $location
    //    const loc = `${path}?page=${pageNo}`
    //    push(loc)
    //}

    let taskPropertiesDialog;
    function runElementProperties(btt, aroundRect, element, kind)
    {
        switch(kind)
        {
        case 'Task':
        case 'FolderTask':
            taskPropertiesDialog.show(element)
            break
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

            <Paper class="mb-64">

            <section class="w-full place-self-center max-w-3xl">

            {#if canconicalPath}
                <Breadcrumb class="mt-1 mb-5" path={canconicalPath}/>
            {/if}


            <section class="hidden w-full sm:flex flex-row mt-3 mr-2">
                <p class="ml-3 pb-5 text-lg text-left">
                    {title}
                </p>

                <!--section class="ml-auto">
                    <Paginator {onPage} {pageNo} {allPagesNo} bind:this={paginatorTop}/>
                </section-->
            </section>

        <List   self={user}
                a='MyTasks'
                toolbarOperations={taskOperations}
                orderAttrib='UserOrder'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(task) => `/task/${task.Id}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <ListComboProperty  name="TaskList" association>
                <ComboSource objects={lists} key="$ref" name='Name'/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>

            <span slot="left" let:element>
                {#if element.State == STATE_FINISHED || isFinishRequested(element)}
                    <Icon component={FaRegCalendarCheck}
                    on:click={(e) => undoFinishTask(e, element)}
                    class="h-5 w-5  text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>

                {:else}
                    <Icon component={FaRegCalendar}
                        on:click={(e) => finishTask(e, element)}
                        class="h-5 w-5  text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>

                {/if}
            </span>


        </List>

        <!--div class="flex sm:hidden flex-row mt-10 mb-20">
            <section class="ml-auto mr-2">
                <Paginator {onPage} {pageNo} {allPagesNo} bind:this={paginatorBtt}/>
            </section>
        </div-->
            
       </Paper>

    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected task?", "¿Está seguro de que desea eliminar la tarea seleccionada?", "Czy na pewno chcesz usunąć wybrane zadanie?"])}
        icon={FaTrash}
        onOkCallback={deleteTask}
        bind:this={deleteModal}
        />

<Modal  title={i18n(['Archive', 'Archivar', 'Zarchiwizuj'])}
        content={i18n(["Are you sure you want to archive selected task?", "¿Está seguro de que desea archivar la tarea seleccionada?", "Czy na pewno chcesz zarchiwizować wybrane zadanie?"])}
        icon={FaArchive}
        onOkCallback={archiveTask}
        bind:this={archiveModal}
        />

<TaskProperties bind:this={taskPropertiesDialog} />