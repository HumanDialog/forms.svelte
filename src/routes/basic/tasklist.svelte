<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                Editable,
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert, showMenu,
				UI, i18n, Breadcrumb, showFloatingToolbar, Paper, PaperHeader,
				ext, refreshToolbarOperations
            } from '$lib'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCalendarCheck, FaRegCalendar, FaPen, FaColumns, FaArchive, FaList,
        FaEllipsisH, FaChevronRight, FaChevronLeft, FaRandom, FaCheck, FaUpload, FaUndo, FaDownload
    } from 'svelte-icons/fa'
    import {location, pop, push, querystring, link} from 'svelte-spa-router'
    import {cache} from './cache.js'
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
	import { fetchComposedClipboard4TaskList, transformClipboardToJSONReferences, setBrowserRecentElement, getBrowserRecentElements } from './basket.utils.js';
    import TaskProperties from './properties.task.svelte'

    export let params = {}

    let currentList = null;
    let listPath;
    let listId;
    let listComponent;
    let isArchivedList = false;
    let isArchivedTasks = false;
    let assocName = 'Tasks'
    let assocFilter = ''
    let listTitle = ''

    let users = [];
    let usersComboSource;

    const STATE_FINISHED = 7000;

    $: onParamsChanged($location, $querystring, $mainContentPageReloader);

    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'tasklist');
        if(foundIdx < 0)
            return;

        if(users.length == 0)
        {
            //let res = await reef.get('/app/Users')
            reef.post('group/query',
                            {
                                Id: 1,
                                Name: 'Users',
                                Tree:[
                                    {
                                        Id: 1,
                                        Association: 'Members/User'
                                    }
                                ]
                            },
                            onErrorShowAlert
                        ).then((res) => {
                            if(res)
                                users = res.User;
                                usersComboSource?.updateObjects(users);
                        })
        }


        if(!segments.length)
            listId = 1;
        else
            listId = parseInt(segments[segments.length-1])

        const params = new URLSearchParams($querystring);
        isArchivedList = params.has('archivedList')
        isArchivedTasks = params.has('archivedTasks')

        //assocName = (isArchivedTasks || isArchivedList) ? 'ArchivedTasks' : 'Tasks';
        if(isArchivedTasks || isArchivedList)
        {
            assocName = 'AllTasks'
            assocFilter = 'Status = STATUS_ARCHIVED'
        }
        else
        {
            assocName = 'Tasks'
            assocFilter = ''
        }

        //currentList = null

        const cacheKey = `tasklist/${listId}`
        const cachedValue = cache.get(cacheKey)
        showCachedDataFirst(cachedValue);

        listPath = `/TaskList/${listId}`;

        const readList = await readListItem();
        if(readList && readList.Id != listId)
            return;

        currentList = readList

        if(currentList)
        {
            if(!isArchivedTasks)
                listTitle = ext(currentList.Name)
            else
                listTitle = `${arichive_of()} ${ext(currentList.Name)}`
        }


        cache.set(cacheKey, currentList)

        listComponent?.reload(currentList, listComponent.KEEP_SELECTION);
    }

    const arichive_of = () => '_; Archive of; Archivo de; Archiwum'

    function showCachedDataFirst(cachedValue)
    {
        if(!cachedValue)
            return;

        currentList = cachedValue
        if(!isArchivedTasks)
            listTitle = ext(currentList.Name)
        else
            listTitle = `${arichive_of()} ${ext(currentList.Name)}`

        listComponent?.reload(currentList, listComponent.KEEP_SELECTION);
    }

    async function readListItem()
    {
        let res = await reef.post(`${listPath}/query`,
                            {
                                Id: 1,
                                Name: "collector",
                                ExpandLevel: 3,
                                Tree:
                                [
                                    {
                                        Id: 1,
                                        Association: '',
                                        Expressions:['Id','Name', 'Summary', 'href', 'GetCanonicalPath', 'IsSubscribed', '$type'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: assocName,
                                                Filter: assocFilter,
                                                Sort: 'ListOrder',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'ListOrder', 'State', 'href', 'icon',  'icon', '$type'],
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
            return res.TaskList;
        else
            return null
    }

    async function fetchData()
    {
        currentList = await readListItem();

        if(currentList)
        {
            if(!isArchivedTasks)
                listTitle = ext(currentList.Name)
            else
                listTitle = `${arichive_of()} ${ext(currentList.Name)}`
        }
    }

    async function reloadTasks(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(currentList, selectRecommendation);
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

    async function finishTask(event, task)
    {
        if(event)
            event.stopPropagation();

        let result = await reef.post(`${task.$ref}/Finish`, {}, onErrorShowAlert);
        if(result)
            await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)
    }

    async function undoFinishTask(event, task)
    {
        if(event)
            event.stopPropagation();

        let result = await reef.post(`${task.$ref}/UndoFinish`, {}, onErrorShowAlert);
        if(result)
            await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`${listPath}/CreateTaskEx`,{ properties: newTaskAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.Task;
        setBrowserRecentElement(newTask.Id, 'Task')
        await reloadTasks(newTask.$ref)
    }

    function getPageOperations()
    {
        if(isArchivedList)
            return [];

        if(isArchivedTasks)
            return [];

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; New task; Nueva tarea; Nowe zadanie',
                            mricon: 'square-pen',
                            action: (f) => { listComponent.addRowAfter(null) },
                            fab: 'M01',
                            tbr: 'A'
                        },
                        {
                            mricon: 'download',
                            caption: '_; Insert; Insertar; Wstaw',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S10',
                            menu: [
                                {
                                    caption: '_; Paste; Pegar; Wklej',
                                    action: pasteRecentClipboardElement
                                },
                                {
                                    caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                                    action: runPasteBasket
                                },
                                {
                                    caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                                    action: runPasteBrowserRecent
                                },
                                {
                                    caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                                    action: runPopupExplorer4SelectFromFolders
                                },
                                {
                                    caption: '_; Select from task lists; Seleccionar de listas de tareas; Wybierz z listy zadań',
                                    action: runPopupExplorer4SelectFromTaskLists
                                }
                            ]
                        },
                        {
                            separator: true
                        },
                        {
                            caption: '_; Follow; Seguir; Obserwuj',
                            action: (f) => toggleSubscribe(),
                            activeFunc: () => currentList.IsSubscribed
                        },
                        {
                            //icon: FaRandom,
                            caption: '_; Change task list kind; Cambiar tipo de lista de tareas; Zmień rodzaj listy zadań',
                            action: changeListKind,
                        //    fab: 'S02',
                        //    tbr: 'C'
                        }
                    ]
                }
            ]
        }



    }

    async function pasteRecentClipboardElement(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4TaskList()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            const res = await reef.post(`${listPath}/AttachClipboard`, { references: references }, onErrorShowAlert)
            if(res)
                reloadTasks(listComponent.KEEP_SELECTION)
        }
    }

    async function runPasteBasket(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4TaskList()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: listPath,
            onRefreshView: (f) => reloadTasks(listComponent.KEEP_SELECTION),
            clipboardElements: clipboardElements,
            ownCloseButton: true
        })
    }

    async function runPasteBrowserRecent(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: listPath,
            onRefreshView: (f) => reloadTasks(listComponent.KEEP_SELECTION),
            clipboardElements: clipboardElements,
            browserBasedClipboard: true,
            ownCloseButton: true
        })
    }

    async function runPopupExplorer4SelectFromFolders(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            mode: 'FOLDERS',
            destinationContainer: listPath,
            onRefreshView: (f) => reloadTasks(listComponent.KEEP_SELECTION),
            ownCloseButton: true
        })
    }

    async function runPopupExplorer4SelectFromTaskLists(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            mode: 'TASKLISTS',
            destinationContainer: listPath,
            onRefreshView: (f) => reloadTasks(listComponent.KEEP_SELECTION),
            ownCloseButton: true
        })
    }

    async function runPopupExplorerToPlaceElement(btt, aroundRect, task)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            canSelectRootElements: true,
            onAttach: async (tmp, references) => {
                await reef.post(`${task.$ref}/AttachMeTo`, { references: references }, onErrorShowAlert)
            },
            ownCloseButton: true
        })
    }

    async function switchToKanban()
    {
        let res = await reef.post(`${listPath}/SwitchToKanban`,{ }, onErrorShowAlert)
        push(`/listboard/${listId}`);
    }




    let taskOperations = (task) => {
        if(isArchivedList)
            return []

        if(isArchivedTasks)
            return []

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; New task; Nueva tarea; Nowe zadanie',
                            mricon: 'square-pen',
                            action: (f) => { listComponent.addRowAfter(task) },
                            fab: 'M01',
                            tbr: 'A'
                        },
                        {
                            mricon: 'download',
                            caption: '_; Insert; Insertar; Wstaw',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S10',
                            menu: [
                                {
                                    caption: '_; Paste; Pegar; Wklej',
                                    action: pasteRecentClipboardElement
                                },
                                {
                                    caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                                    action: runPasteBasket
                                },
                                {
                                    caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                                    action: runPasteBrowserRecent
                                },
                                {
                                    caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                                    action: runPopupExplorer4SelectFromFolders
                                },
                                {
                                    caption: '_; Select from task lists; Seleccionar de listas de tareas; Wybierz z listy zadań',
                                    action: runPopupExplorer4SelectFromTaskLists
                                }
                            ]
                        },
                        {
                            separator: true
                        },
                        {
                            caption: '_; Follow; Seguir; Obserwuj',
                            action: (f) => toggleSubscribe(),
                            activeFunc: () => currentList.IsSubscribed
                        },
                        {
                            caption: '_; Change task list kind; Cambiar tipo de lista de tareas; Zmień rodzaj listy zadań',
                            action: changeListKind,
                        }
                    ]
                },
                {
                    caption: '_; Task; Tarea; Zadanie',
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
                                    caption: '_; Responsible; Responsable; Odpowiedzialny',
                                    action: (focused) => { listComponent.edit(task, 'Actor') }
                                },
                                {
                                    caption: '_; Due Date; Fecha; Termin',
                                    action: (focused) => { listComponent.edit(task, 'DueDate') }
                                }

                            ]
                        },
                       /* ... (task.State == STATE_FINISHED) ? [
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
                                mricon: 'check',
                                action: (f) => finishTask(undefined, task),
                                disabled: task.State == STATE_FINISHED
                                fab: 'M03',
                                tbr: 'A'
                            }
                        ], */
                         {
                            caption: '_; Finish; Finalizar; Zakończ',
                            mricon: 'check',
                            action: (f) => finishTask(undefined, task),
                            disabled: task.State == STATE_FINISHED,
                            fab: 'M03',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            mricon: 'chevron-up',
                            action: (f) => listComponent.moveUp(task),
                            fab: 'M05',
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            mricon: 'chevron-down',
                            action: (f) => listComponent.moveDown(task),
                            fab: 'M04',
                            tbr: 'A',
                            hideToolbarCaption: true
                        },

                        {
                            caption: '_; Send; Enviar; Wyślij',
                            mricon: 'upload',
                            tbr: 'D',
                            fab: 'S00',
                            menu: [
                                {
                                    caption: '_; Copy; Copiar; Kopiuj',
                                    action: (f) => copyTaskToBasket(task),
                                },
                                {
                                    caption: '_; Cut; Cortar; Wytnij',
                                    action: (f) => cutTaskToBasket(task)
                                },
                                {
                                    caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                    action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect, task)
                                }
                            ],
                            hideToolbarCaption: true
                        },

                        {
                            //icon: FaArchive,
                            caption: '_; Archive; Archivar; Zarchiwizuj',
                            action: (f) => askToArchive(task)
                        },
                        {
                            //icon: FaTrash,
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

    function getDefaultTypeSummary(list)
    {
        if(!list.TaskStates)
            return '';

        let result = ''
        list.TaskStates.forEach(s => {
            if(result)
                result += ', '
            result += ext(s.name)
        })

        return result
    }

    async function changeListKind(button, aroundRect)
    {
        const listTypes = await reef.get('group/GetTaskListTypes', onErrorShowAlert)
        if(!listTypes || !Array.isArray(listTypes) || listTypes.length == 0)
            return;

        let menuOperations = []
        let prevKind = 0;

        listTypes.forEach(template => {

            //if(prevKind != template.Kind)
            //    menuOperations.push({separator: true})
            //prevKind = template.Kind

            menuOperations.push({
                caption: ext(template.Name),
                description: template.Summary ? ext(template.Summary) : getDefaultTypeSummary(template),
                action: (f) => askToChangeListKind(template)
            })
        })

        if(menuOperations.length > 0)
        {
            let rect;
            if(aroundRect)
                rect = aroundRect
            else
                rect = button.getBoundingClientRect()
            showMenu(rect, menuOperations)
        }
    }

    let changeKindModal;
    let changeListTo = null;
    function askToChangeListKind(template)
    {
        changeListTo = template

        changeKindModal.show();
    }

    async function handleChangeListKind()
    {
        changeKindModal.hide();

        if(!changeListTo)
            return

        let newHref = await reef.post(`${listPath}/ChangeListKind`, {
            template: changeListTo
        }, onErrorShowAlert)

        changeListTo = null

        if(!newHref)
            return null;

        push(newHref)
        if(UI.navigator)
            UI.navigator.refresh();
    }

    async function copyTaskToBasket(task)
    {
        await reef.post(`${listPath}/CopyTaskToBasket`, {
                task: task.$ref,
                flags: 0},
                onErrorShowAlert)
    }

    async function cutTaskToBasket(task)
    {
        await reef.post(`${listPath}/CutTaskToBasket`, {
                task: task.$ref,
                flags: 0},
                onErrorShowAlert)

        reloadTasks(listComponent.SELECT_NEXT);
    }

    async function toggleSubscribe()
    {
        if(currentList.IsSubscribed)
        {
            const res = await reef.get(`${listPath}/Unsubscribe`, onErrorShowAlert)
            if(res)
                currentList.IsSubscribed = false
        }
        else
        {
            const res = await reef.get(`${listPath}/Subscribe`, onErrorShowAlert)
            if(res)
                currentList.IsSubscribed = true
        }

        refreshToolbarOperations()
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
    {#if currentList && listTitle}
        <title>{listTitle} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>

{#if currentList}
    {#key listPath + isArchivedTasks} <!-- to force new page operations -->
    <Page   self={currentList}
        toolbarOperations={ getPageOperations() }
        clearsContext='props sel'
        title={listTitle}>

        <Paper>

        <PaperHeader>
        <Breadcrumb  path = {currentList.GetCanonicalPath}/>
        </PaperHeader>

        <!--div class="w-full flex flex-row justify-between">
            <span>Index 23</span>
        </div-->


        <h1><Editable self={currentList} a='Name'/></h1>

        {#if currentList.Summary}
        <p class="lead"> <Editable self={currentList} a='Summary'/></p>
        {/if}


        <List   self={currentList}
                a={assocName}
                {list_properties}

                toolbarOperations={taskOperations}
                orderAttrib='ListOrder'
                bind:this={listComponent}>

            <ListInserter action={addTask} icon/>

            <ListComboProperty  name="Actor" association hasNone>
                <ComboSource objects={users} key="$ref" name='Name' bind:this={usersComboSource}/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>



        </List>

        {#if !isArchivedTasks}
            {#if !isArchivedList}
                <div class="ml-3 mt-20 mb-10">
                    <a  href={`/tasklist/${listId}?archivedTasks`}
                        class="hover:underline"
                        use:link>
                            _; Show archived tasks; Mostrar tareas archivadas; Pokaż zarchiwizowane zadania
                            <div class="inline-block mt-1.5 w-3 h-3"><FaChevronRight/></div>
                    </a>
                </div>
            {/if}
        {:else}
            <div class="ml-3 mt-20  mb-10">
                <button on:click={(e) => pop() }>
                    <div class="inline-block mt-1.5 w-3 h-3"><FaChevronLeft/></div>
                    _; Back; Volver; Wróć
                </button>

            </div>
        {/if}

        </Paper>
    </Page>
    {/key}
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

<Modal  title={i18n(['Change list kind', 'Cambiar tipo de lista', 'Zmień rodzaj listy'])}
        content={i18n(["Are you sure you want to change current list kind?", "¿Estás seguro de que deseas cambiar el tipo de lista actual?", "Czy na pewno chcesz zmienić aktualny rodzaj listy?"])}
        icon={FaRandom}
        onOkCallback={handleChangeListKind}
        okCaption={i18n(['Change', 'Cambiar', 'Zmień'])}
        bind:this={changeKindModal}
        />

<TaskProperties bind:this={taskPropertiesDialog} />