<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                ComboSource,
                Editable,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert,
				activateItem, UI,
				i18n, ext,
                Breadcrumb,
                refreshToolbarOperations,
				showFloatingToolbar,
                reloadPageToolbarOperations, Paper, PaperHeader, openInNewTab, copyAddress,
				focusEditable} from '$lib'
    import {FaTrash, FaCloudUploadAlt} from 'svelte-icons/fa'


    import {onMount} from 'svelte'
    import {location, pop, push, querystring} from 'svelte-spa-router'
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
    import {fetchComposedClipboard4Folder, transformClipboardToJSONReferences, getBrowserRecentElements, setBrowserRecentElement, recentClipboardElements} from './basket.utils'
    import {cache} from './cache.js'
    import {getElementIcon} from './icons'
	import FolderProperties from './properties.folder.svelte'
    import FileProperties from './properties.file.svelte'
	import TaskProperties from './properties.task.svelte'
    import NoteProperties from './properties.note.svelte'

    export let params = {}

    let contextItem = null;
    let contextPath;
    let contextItemId;
    let listComponent;
    let folderTitle = ''
    let pendingUploading = false;

    let users = [];

    const STATE_FINISHED = 7000;

    const FK_FOLDER             = 0
    const FK_BASKET             = 1
    const FK_DISCUSSION         = 2
    const FK_TABLE              = 3
    const FK_DOCUMENT           = 4

    $: onParamsChanged($location, $querystring, $mainContentPageReloader, $session);

    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'folder');
        if(foundIdx < 0)
            return;

        if(!segments.length)
            contextItemId = 1
        else
            contextItemId = parseInt(segments[segments.length-1])


        contextItem = null
        contextPath = `/Folder/${contextItemId}`


        const cacheKey = `folder_${contextItemId}`
        const cachedValue = cache.get(cacheKey)
        if(cachedValue)
        {
            contextItem = cachedValue;
            folderTitle = ext(contextItem.Title);

            listComponent?.reload(contextItem, listComponent.KEEP_SELECTION)
        }

        const readItem = await readContextItem(contextItemId)

        // dodatkowe zabezpiecznie dla przypadku kiedy pokazalismy folder, ale jego wersje z cache'a
        // i wciąż jeszcze czekamy na odpowiedź z serwisu. W międzyczasie user przeszedł do folderu niżej
        // zostajemy więc w tym komponencie, ale zmienił się parametr folderu do załadowania
        // wysyłamy więc nowe zapytanie, a to poprzednie, które wciąż jeszcze trwa, już nas nie interesuje
        if(readItem.Id != contextItemId)
            return;

        contextItem  = readItem
        if(contextItem)
        {
            folderTitle = ext(contextItem.Title);
            setupAllElements(contextItem)
        }

        listComponent?.reload(contextItem, listComponent.KEEP_SELECTION)
    }

    async function readContextItem(contextItemId)
    {
        let res = await reef.post(`/Folder/${contextItemId}/query`,
        {
            Id: 1,
            Name: "collector",
            ExpandLevel: 3,
            Tree:
            [
            {   Id: 1, Association: '',
                Expressions:['Id', '$ref', '$type', 'icon', 'Title','Summary', 'Kind', 'ModificationDate', 'CreatedBy', 'IsPinned', 'IsBasket', 'IsRootPinned', 'GetCanonicalPath'],
                SubTree:[
                    {   Id: 2, Association: 'Folders',
                        Expressions:['Id','$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'IsInBasket' , 'IsCanonical',  'icon', 'FolderId', '$type']
                    },
                    { Id: 3, Association: 'Notes',
                        Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'NoteId', '$type']
                    },
                    {
                        Id: 4,
                        Association: 'Tasks',
                        //Filter: 'State <> STATE_FINISHED',
                        //Sort: 'Order',
                        Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'State', 'ListName', 'DueDate', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'icon', 'TaskId', '$type']

                    },
                    {
                        Id: 5,
                        Association: 'Files',
                        Expressions:['Id', 'FileId', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'FileId', '$type']

                    }
                ]
            }
        ]
        },
        onErrorShowAlert);
        if(res)
        {
            const folderItem = res.Folder
            const cacheKey = `folder_${folderItem.Id}`
            cache.set(cacheKey, folderItem)
            return folderItem;
        }
        else
            return null;
    }

    function setupAllElements(contextItem)
    {
        contextItem.allElements = []
        if(contextItem.Folders)
            contextItem.allElements = [...contextItem.allElements, ...contextItem.Folders]

        if(contextItem.Notes)
            contextItem.allElements = [...contextItem.allElements, ...contextItem.Notes]

        if(contextItem.Tasks)
            contextItem.allElements = [...contextItem.allElements, ...contextItem.Tasks]

        if(contextItem.Files)
            contextItem.allElements = [...contextItem.allElements, ...contextItem.Files]

        contextItem.allElements.sort((a,b) => a.Order - b.Order)
    }

    async function fetchData()
    {
        contextItem = await readContextItem(contextItemId);
        if(contextItem)
        {
            folderTitle = ext(contextItem.Title);
            setupAllElements(contextItem)
        }
    }

    /*onMount( () => {
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
        }
    })

    function onKeyDown(e)
    {
        switch(e.key)
        {
        case 'c':
            if(e.ctrlKey || e.metaKey)
            {
                console.log('handle Ctrl+C')
                e.stopPropagation()
                e.preventDefault()
            }
            break;

        case 'x':
            if(e.ctrlKey || e.metaKey)
            {
                console.log('handle Ctrl+X')
                e.stopPropagation()
                e.preventDefault()
            }
            break;

        case 'v':
            if(e.ctrlKey || e.metaKey)
            {
                console.log('handle Ctrl+V')
                e.stopPropagation()
                e.preventDefault()
            }
            break;
        }
    }
    */

    let deleteModal;
    let objectToDelete;
    let deleteObjectKind = ''
    function askToDelete(object, kind)
    {
        deleteObjectKind = kind;
        objectToDelete = object;
        deleteModal.show()
    }


    async function deleteElement()
    {
        if(!objectToDelete)
            return;

        switch(deleteObjectKind)
        {
        case 'Task':
        case 'FolderTask':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyTask`, { taskLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            listComponent.reload(contextItem, listComponent.SELECT_NEXT);
            break;

        case 'Note':
        case 'FolderNote':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyNote`, { noteLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            listComponent.reload(contextItem, listComponent.SELECT_NEXT);
            break;

        case 'Folder':
        case 'FolderFolder':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyFolder`, { folderLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            listComponent.reload(contextItem, listComponent.SELECT_NEXT);
            break;

        case 'UploadedFile':
        case 'FolderFile':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyFile`, { fileLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            listComponent.reload(contextItem, listComponent.SELECT_NEXT);
            break;

        case 'multi':
            {
                let refs = []
                objectToDelete.forEach(i =>
                    refs.push({
                        Type: i.$type,
                        Id: i.Id,
                        Title: i.Title,
                        ref: i.$ref
                        })
                )
                await reef.post(`${contextItem.$ref}/DeletePermanentlyMulti`, { items: refs } , onErrorShowAlert);
                deleteModal.hide();
                await fetchData();
                listComponent.reload(contextItem, listComponent.SELECT_NEXT);
            }
            break;
        }

    }

    async function dettachSubFolder(folder)
    {
        await reef.post(`${contextItem.$ref}/DettachSubFolder`, { folderLink: folder.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }

    async function dettachNote(note)
    {
        await reef.post(`${contextItem.$ref}/DettachNote`, { noteLink: note.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }

    async function dettachTask(task)
    {
        await reef.post(`${contextItem.$ref}/DettachTask`, { taskLink: task.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }

    async function dettachFile(file)
    {
        await reef.post(`${contextItem.$ref}/DettachFile`, { fileLink: file.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }

    async function setLocationAsCanonical(element)
    {
        await reef.get(`${element.$ref}/SetLocationAsCanonical`, onErrorShowAlert)
        await fetchData();
        listComponent.reload(contextItem, listComponent.KEEP_SELECTION);
    }

    async function copyTaskToBasket(task)
    {
        await reef.post(`${contextItem.$ref}/CopyTaskToBasket`, { taskLink: task.$ref } , onErrorShowAlert);
        //task.IsInBasket = true
        refreshToolbarOperations()
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutTaskToBasket(task)
    {
        await reef.post(`${contextItem.$ref}/CutTaskToBasket`, { taskLink: task.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }

    async function copyNoteToBasket(note)
    {
        await reef.post(`${contextItem.$ref}/CopyNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        //note.IsInBasket = true
        refreshToolbarOperations()
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutNoteToBasket(note)
    {
        await reef.post(`${contextItem.$ref}/CutNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }

    async function copyFileToBasket(file)
    {
        await reef.post(`${contextItem.$ref}/CopyFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
        //file.IsInBasket = true
        refreshToolbarOperations()
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutFileToBasket(file)
    {
        await reef.post(`${contextItem.$ref}/CutFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }

    async function copySubFolderToBasket(folder)
    {
        await reef.post(`${contextItem.$ref}/CopySubFolderToBasket`, { folderLink: folder.$ref } , onErrorShowAlert);
        //folder.IsInBasket = true
        refreshToolbarOperations()
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutSubFolderToBasket(folder)
    {
        await reef.post(`${contextItem.$ref}/CutSubFolderToBasket`, { folderLink: folder.$ref } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }


    async function finishTask(event, task)
    {
        if(event)
            event.stopPropagation();

        let result = await reef.post(`${task.$ref}/Finish`, {}, onErrorShowAlert);
        if(result)
        {
            await fetchData();
            listComponent.reload(contextItem, listComponent.KEEP_OR_SELECT_NEXT);
        }
    }

    let newElementKind = ''
    async function addElement(newElementAttribs)
    {
        switch(newElementKind)
        {
        case 'Folder':
        case 'FolderFolder':
            return await addFolder(newElementAttribs)

        case 'Note':
        case 'FolderNote':
            return await addNote(newElementAttribs)

        case 'Task':
        case 'FolderTask':
            return await addTask(newElementAttribs)

        case 'UploadedFile':
        case 'FolderFile':
            return await addFile(newElementAttribs)

        case 'Forum':
            return await addForum(newElementAttribs)

        case 'Thread':
            return await addThread(newElementAttribs)
        }
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateTaskEx`,{ properties: newTaskAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.FolderTask;
        setBrowserRecentElement(newTask.TaskId, 'Task')

        await fetchData();
        listComponent.reload(contextItem, newTask.$ref);
    }

    async function addNote(newNoteAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateNoteEx`,{ properties: newNoteAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newNote = res.FolderNote;
        setBrowserRecentElement(newNote.NoteId, 'Note')

        await fetchData();
        listComponent.reload(contextItem, newNote.$ref);
    }

    async function addFile(newFileAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateFileEx`,{ properties: newFileAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newFile = res.FolderFile;

        await fetchData();
        listComponent.reload(contextItem, newFile.$ref);
    }

    async function addFolder(newFolderAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateSubFolder`,{
            title: newFolderAttribs.Title,
            summary:  newFolderAttribs.Summary,
            order: newFolderAttribs.Order,
            kind: 0
        }, onErrorShowAlert)
        if(!res)
            return null;

        let newFolder = res.FolderFolder;

        await fetchData();
        listComponent.reload(contextItem, newFolder.$ref);
    }

    async function addForum(newFolderAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateSubForum`,{
            title: newFolderAttribs.Title,
            summary:  newFolderAttribs.Summary,
            order: newFolderAttribs.Order,
            kind: 0
        }, onErrorShowAlert)
        if(!res)
            return null;

        let newFolder = res.FolderFolder;

        await fetchData();
        listComponent.reload(contextItem, newFolder.$ref);
    }

    async function addThread(newNoteAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateThread`,{
            title: newNoteAttribs.Title,
            summary:  newNoteAttribs.Summary,
            order: newNoteAttribs.Order})

        if(!res)
            return null;

        let newNote = res.FolderNote;
        setBrowserRecentElement(newNote.NoteId, 'Note')

        await fetchData();
        listComponent.reload(contextItem, newNote.$ref);
    }

    async function toggleFolderPinned(folder)
    {
        let res = await reef.post(`${folder.$ref}/TogglePinned`, {}, onErrorShowAlert)
        if(res)
        {
            folder.IsPinned = true
        }
        else
        {
            folder.IsPinned = false
        }
    }

    async function changeElementProperty(item, value, propName)
    {
        item[propName] = value

        switch(propName)
        {
        case 'Title':
            await reef.post(`${item.$ref}/SetTitle`, { value: value }, onErrorShowAlert)
            break;

        case 'Summary':
            await reef.post(`${item.$ref}/SetSummary`, { value: value }, onErrorShowAlert)
            break;
        }

    }

    async function dettachAllMyContent()
    {
        await reef.post(`${contextItem.$ref}/DettachAllContent`, {} , onErrorShowAlert)

        await fetchData();
        listComponent.reload(contextItem, listComponent.CLEAR_SELECTION)
    }

    async function refreshView()
    {
        await fetchData();
        listComponent.reload(contextItem, listComponent.KEEP_SELECTION)
    }

    function pinOp()
    {
        let pinOperation;
        if(contextItem.IsPinned)
        {
            pinOperation = {
                caption: '_; Unpin folder; Desenganchar la carpeta; Odepnij folder',
                //icon: FaStar, //aRegShareSquare, //
                action: async (f) => {
                    await toggleFolderPinned(contextItem);
                    // refreshing operations
                    activateItem('data', contextItem, getPageOperations());
                    if(UI.navigator)
                        UI.navigator.refresh()
                    },
                //fab: 'S00',
                //tbr: 'C',
                //hideToolbarCaption: true
            }
        }
        else
        {
            pinOperation = {
                caption: '_; Pin folder; Fijar carpeta; Przypnij folder',
                //icon: FaRegStar, //aRegShareSquare, //
                action: async (f) => {
                    await toggleFolderPinned(contextItem);
                    // refreshing operations
                    activateItem('data', contextItem, getPageOperations());
                    if(UI.navigator)
                        UI.navigator.refresh()
                },
                //fab: 'S00',
                //tbr: 'C',
                //hideToolbarCaption: true
            }
        }
        return pinOperation;
    }

    function newElementOperations(afterElement)
    {
        const isClipboard = contextItem.IsBasket
        const isRootPinned = contextItem.IsRootPinned
        const isForum = contextItem.Kind == FK_DISCUSSION

        const canAddFolders = !(isRootPinned || isClipboard || isForum)
        const canAddNotes = !(isRootPinned || isClipboard || isForum)
        const canAddTasks = !(isRootPinned || isClipboard || isForum)
        const canAddFiles = !(isRootPinned || isClipboard || isForum)
        const canAddForum = isForum//!(isRootPinned || isClipboard)
        const canAddThread = isForum


        const newFolder = {
            caption: '_; New folder; Nueva carpeta; Nowy folder',
            hideToolbarCaption: true,
            mricon: 'folder',
            action: (f) => { newElementKind='Folder';  listComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M04'
        }

        const newNote = {
            caption: '_; New note; Nueva nota; Nowa notatka',
            hideToolbarCaption: true,
            mricon:'file-text',
            action: (f) => { newElementKind='Note';  listComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M03'
        }

        const newTask = {
            caption: '_; New task; Nueva tarea; Nowe zadanie',
            hideToolbarCaption: true,
            mricon:'square-pen',
            action: (f) => { newElementKind='Task';  listComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M02'
        }

        const newFile = {
            caption: '_; Add file; Añadir archivo; Dodaj plik',
            hideToolbarCaption: true,
            mricon: 'file-archive',
            action: (f) => { newElementKind='UploadedFile';  runFileAttacher(afterElement) },
            tbr: 'A',
            fab: 'M01'
        }

        const newForum = {
            caption: '_; New forum; Nuevo foro; Nowe forum',
            hideToolbarCaption: !isForum,
            mricon: 'messages-square',
            action: (f) => { newElementKind='Forum';  listComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M04'
        }

        const newThread = {
            caption: '_; New thread; Nuevo hilo; Nowy wątek',
            //hideToolbarCaption: true,
            mricon: 'message-square',
            action: (f) => { newElementKind='Thread';  listComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M03'
        }


        let result = {
            caption: '_; File; Archivo; Plik',
            // tbr: 'B',
            operations: [ ]
        }

        if(canAddFolders)
            result.operations.push(newFolder)

        if(canAddNotes)
            result.operations.push(newNote)

        if(canAddTasks)
            result.operations.push(newTask)

        if(canAddFiles)
            result.operations.push(newFile)

        if(canAddForum)
            result.operations.push(newForum)

        if(canAddThread)
            result.operations.push(newThread)

        //if(result.operations.length > 0)
        //    result.operations.push({separator: true})

        return result
    }

    const insertOperation = {
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

        //fab: 'M01',
        //tbr: 'A'
    }

    async function pasteRecentClipboardElement(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Folder()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            const res = await reef.post(`${contextPath}/AttachClipboard`, { references: references }, onErrorShowAlert)
            if(res)
                refreshViewAfterAttachingFromBasket(res);
        }
    }

    async function runPasteBasket(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Folder()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: contextPath,
            onRefreshView: refreshViewAfterAttachingFromBasket,
            clipboardElements: clipboardElements,
            ownCloseButton: true
        })
    }

    async function runPasteBrowserRecent(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: contextPath,
            onRefreshView: refreshViewAfterAttachingFromBasket,
            clipboardElements: clipboardElements,
            browserBasedClipboard: true,
            ownCloseButton: true
        })
    }

    async function runPopupExplorer4SelectFromFolders(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'FOLDERS',
            destinationContainer: contextPath,
            onRefreshView: refreshViewAfterAttachingFromBasket,
            ownCloseButton: true
        })
    }

    async function runPopupExplorer4SelectFromTaskLists(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'TASKLISTS',
            destinationContainer: contextPath,
            onRefreshView: refreshViewAfterAttachingFromBasket,
            ownCloseButton: true
        })
    }

    async function runPopupExplorer4CopyToFolder(btt, aroundRect, element, kind)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'FOLDERS',
            attachToContainer: true,
            canAttachAsRootFolder: kind=='FolderFolder' ? true : false,
            onAttach: async (tmp, references) => {
                await reef.post(`${element.$ref}/AttachMeTo`, { references: references }, onErrorShowAlert)
            },
            ownCloseButton: true
        })
    }

    async function runPopupExplorer4MoveToFolder(btt, aroundRect, element, kind)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'FOLDERS',
            attachToContainer: true,
            canAttachAsRootFolder: kind=='FolderFolder' ? true : false,
            onAttach: async (tmp, references) => {
                await reef.post(`${element.$ref}/MoveMeTo`, { references: references })
                await fetchData();
                listComponent.reload(contextItem, listComponent.CLEAR_SELECTION)
            },
            ownCloseButton: true
        })
    }

    async function runPopupExplorer4SelectTaskList(btt, aroundRect, element, kind)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'TASKLISTS',
            attachToContainer: true,
            onAttach: async (tmp, references) => {
                await reef.post(`${element.$ref}/AttachMeTo`, { references: references }, onErrorShowAlert)
            },
            ownCloseButton: true
        })
    }


    function  folderPageOperations()
    {
        const isClipboard = contextItem.IsBasket
        const isRootPinned = contextItem.IsRootPinned
        const canPin = !(isRootPinned || isClipboard)

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                newElementOperations(null),
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            caption: '_; Edit; Editar; Edytuj',
                            hideToolbarCaption: true,
                            mricon: 'pencil',
                            tbr: 'A',
                            fab:'M20',
                            grid:[
                                {
                                    caption: '_; Title; Título; Tytuł',
                                    action: () =>  { focusEditable('Title') },
                                },
                                {
                                    caption: '_; Summary; Resumen; Podsumowanie',
                                    action: () =>  { focusEditable('Summary') }
                                }
                            ]
                        },
                        insertOperation,
                        ... !canPin ? [] : [pinOp()],
                        {
                            caption: '_; Select; Seleccionar; Zaznacz',
                            mricon: 'check-check',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S20',
                            action: (f) => { listComponent.toggleMultiselection(); reloadPageToolbarOperations(multiselectPageOperations()) }
                        },
                        {
                            caption: '_; Refresh; Actualizar; Odśwież',
                            action: async (f) => await refreshView(),
                        },
                        {
                            caption: '_; Properties; Propiedades; Właściwości',
                            action: (btt, rect)=> runElementProperties(btt, rect, contextItem, 'Folder')
                        }
                    ]
                }

            ]
        }
    }

    function multiselectPageOperations()
    {
        const isClipboard = contextItem.IsBasket
        const isRootPinned = contextItem.IsRootPinned
        const canPin = !(isRootPinned || isClipboard)

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            caption: '_; All; Todos; Wszystkie',
                            ricon: '',
                            action: () => listComponent.toggleSelectAll(),
                            ctrl: "main_list",
                            list_action: "toggle_select_all",
                            //fab: 'M30',
                            tbr: 'A',
                        },
                       // ... !canPin ? [] : [pinOp()],
                        {
                            caption: '_; Select; Seleccionar; Zaznacz',
                            mricon: 'check-check',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S20',
                            action: (f) => { listComponent.toggleMultiselection(); reloadPageToolbarOperations(getPageOperations()) },
                            active: true
                        },
                        {
                            caption: '_; Refresh; Actualizar; Odśwież',
                            action: async (f) => await refreshView(),
                        }
                    ]
                }
            ]
        }
    }

    function getPageOperations()
    {
        if(!contextItem)
            return [];

        return folderPageOperations();
    }

    async function refreshViewAfterAttachingFromBasket(f)
    {
        await fetchData();
        listComponent.reload(contextItem, listComponent.CLEAR_SELECTION)
    }



    async function dettachElement(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
        case 'FolderFolder':
            return dettachSubFolder(element)
        case 'Note':
        case 'FolderNote':
            return dettachNote(element)
        case 'Task':
        case 'FolderTask':
            return dettachTask(element)
        case 'UploadedFile':
        case 'FolderFile':
            return dettachFile(element)
        }
    }

    async function dettachElementMulti(items)
    {
        let refs = []
        items.forEach(i =>
            refs.push({
                Type: i.$type,
                Id: i.Id,
                Title: i.Title,
                ref: i.$ref
                })
        )

        await reef.post(`${contextItem.$ref}/DettachElementMulti`, { items: refs } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }



    async function copyElementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
        case 'FolderFolder':
            return copySubFolderToBasket(element)
        case 'Note':
        case 'FolderNote':
            return copyNoteToBasket(element)
        case 'Task':
        case 'FolderTask':
            return copyTaskToBasket(element)
        case 'UploadedFile':
        case 'FolderFile':
            return copyFileToBasket(element)
        }
    }

    async function cutElementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
        case 'FolderFolder':
            return cutSubFolderToBasket(element)
        case 'Note':
        case 'FolderNote':
            return cutNoteToBasket(element)
        case 'Task':
        case 'FolderTask':
            return cutTaskToBasket(element)
        case 'UploadedFile':
        case 'FolderFile':
            return cutFileToBasket(element)
        }
    }

    async function copyElementToBasketMulti(items)
    {
        let refs = []
        items.forEach((i) => refs.push(i.$ref))
        refs.reverse()  // elements need to be pushed in reverse order to have first element on top of the clipboard

        await reef.post(`${contextItem.$ref}/CopyToBasketMulti`, { refs: refs } , onErrorShowAlert);

        refreshToolbarOperations()
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutElementToBasketMulti(items)
    {
        let refs = []
        items.forEach((i) => refs.push(i.$ref))
        refs.reverse()  // elements need to be pushed in reverse order to have first element on top of the clipboard

        await reef.post(`${contextItem.$ref}/CutToBasketMulti`, { refs: refs } , onErrorShowAlert);
        await fetchData();
        listComponent.reload(contextItem, listComponent.SELECT_NEXT);
    }



    function folderElementOperations(element, kind)
    {
        const isClipboard = contextItem.IsBasket
        const isRootPinned = contextItem.IsRootPinned
        const canPin = !(isRootPinned || isClipboard)
        const isCanonical = element.IsCanonical
        const isForum = contextItem.Kind == FK_DISCUSSION

        let list = listComponent;

        let linkOperations = []
        if(isCanonical)
        {
            linkOperations = [
                {
                    caption: '_; Delete; Eliminar; Usuń',
                    action: (f) => askToDelete(element, kind)
                }
            ]
        }
        else
        {
             linkOperations = [
                {
                    caption: '_; Detach; Desconectar; Odłącz',
                    action: (f) => dettachElement(element, kind)
                }
            /*    {
                    caption: '_; Set as primary location; Establecer como ubicación principal; Ustaw jako główną lokalizację',
                    action: (f) => setLocationAsCanonical(element)
                }*/
             ]
        }


        return {
                opver: 2,
                fab: 'M00',
                tbr: 'D',
                operations: [
                    newElementOperations(element),
                    {
                        caption: '_; Element; Elemento; Element',
                        operations: [
                            {
                                caption: '_; Edit; Editar; Edytuj',
                                hideToolbarCaption: true,
                                mricon: 'pencil',
                                tbr: 'A',
                                fab:'M20',
                                grid:[
                                    {
                                        caption: '_; Title; Título; Tytuł',
                                        action: (focused) =>  { listComponent.edit(element, 'Title') },
                                        tbr: 'A',

                                    },
                                    {
                                        caption: '_; Summary; Resumen; Podsumowanie',
                                        action: (focused) =>  { listComponent.edit(element, 'Summary') }
                                    }
                                ]

                            },
                            {
                                caption: '_; Move to top ; Mover al principio de la lista; Przesuń na szczyt',
                                mricon: 'chevrons-up',
                                action: (f) => list.moveTop(element),
                                fab:'M09',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                                mricon: 'chevron-up',
                                action: (f) => list.moveUp(element),
                                fab:'M08',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                                mricon: 'chevron-down',
                                action: (f) => list.moveDown(element),
                                fab:'M07',
                                tbr:'A' ,
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Send; Enviar; Wyślij',
                                hideToolbarCaption: true,
                                mricon: 'upload',
                                tbr: 'C',
                                fab: 'S00',
                                menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyElementToBasket(element, kind),
                                    },
                                    {
                                        caption: '_; Cut; Cortar; Wytnij',
                                        action: (f) => cutElementToBasket(element, kind)
                                    },
                                    {
                                        caption: '_; Copy to folder; Copiar a la carpeta; Kopiuj do folderu',
                                        action: (btt, rect) => runPopupExplorer4CopyToFolder(btt, rect, element, kind)
                                    },
                                    {
                                        caption: '_; Move to folder; Mover a la carpeta; Przenieś do folderu',
                                        action: (btt, rect) => runPopupExplorer4MoveToFolder(btt, rect, element, kind),

                                    },
                                    ... (kind != 'FolderTask') ? [] :
                                    [
                                        {
                                            caption: '_; Select a task list; Selecciona la lista de tareas; Wybierz listę zadań',
                                            action: (btt, rect) => runPopupExplorer4SelectTaskList(btt, rect, element, kind)
                                        }
                                    ],
                                    { separator: true},
                                    {
                                        caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                                        action: () => openInNewTab(element.href)
                                    },
                                    {
                                        caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                                        action: () => copyAddress(element.href)
                                    }

                                ]
                            },
                            {
                                separator: true
                            },
                            ...linkOperations,
                            {
                                caption: '_; Properties; Propiedades; Właściwości',
                                action: (btt, rect)=> runElementProperties(btt, rect, element, kind)
                            }
                        ]
                    },
                    {
                        caption: '_; View; Ver; Widok',
                        operations: [
                        insertOperation,
                        ... !canPin ? [] : [pinOp()],
                         {
                            caption: '_; Select; Seleccionar; Zaznacz',
                            mricon: 'check-check',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S20',
                            action: (f) => { listComponent.toggleMultiselection(); reloadPageToolbarOperations(multiselectPageOperations()) }
                        },
                        {
                            caption: '_; Refresh; Actualizar; Odśwież',
                            action: async (f) => await refreshView(),
                        }
                        ]
                    }
                ]
            }
    }



    let elementOperations = (element, kind) => {
        return folderElementOperations(element, kind)
    }

    function multiselectOperations(items)
    {
        //if(items.length == 0)
        //    return []
        //else if(items.length == 1)      // not sure
        //    return elementOperations(items[0], items[0].$type)
        //else if(contextItem.IsBasket)
        //    return multiselectBasketOperations(items)
        //else
        {
            const isClipboard = contextItem.IsBasket
            const isRootPinned = contextItem.IsRootPinned
            const canPin = !(isRootPinned || isClipboard)

        return {
                opver: 2,
                fab: 'M00',
                tbr: 'D',
                operations: [
                    //newElementOperations(element),
                    {
                        caption: '_; Element; Elemento; Element',
                        operations: [
                            {
                                caption: '_; All; Todos; Wszystkie',
                                action: () => listComponent.toggleSelectAll(),
                                //fab: 'M30',
                                tbr: 'A',
                            },
                            {
                                caption: '_; Send; Enviar; Wyślij',
                                mricon: 'upload',
                                tbr: 'C',
                                fab: 'S00',
                                menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyElementToBasketMulti(items),
                                    },
                                    {
                                        caption: '_; Cut; Cortar; Wytnij',
                                        action: (f) => cutElementToBasketMulti(items)
                                    },
                                    {
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        disabled: true
                                    }
                                ],
                                hideToolbarCaption: true
                            },
                            {
                                separator: true
                            },
                            {
                                caption: '_; Detach; Desconectar; Odłącz',
                          //      icon: FaUnlink,
                                action: (f) => dettachElementMulti(items),
                            },
                            {
                                caption: '_; Delete; Eliminar; Usuń',
                             //   icon: FaTrash,
                                action: (f) => askToDelete(items, 'multi'),
                            }
                        ]
                    },
                    {
                        caption: '_; View; Ver; Widok',
                        //tbr: 'B',
                        operations: [
                           // ... !canPin ? [] : [pinOp()],
                            {
                                caption: '_; Select; Seleccionar; Zaznacz',
                                mricon: 'check-check',
                                hideToolbarCaption: true,
                                tbr: 'C',
                                fab: 'S20',
                                action: (f) => { listComponent.toggleMultiselection(); reloadPageToolbarOperations(getPageOperations()); },
                                active: true
                            },
                            {
                                caption: '_; Refresh; Actualizar; Odśwież',
                                //icon: FaSync,
                                action: async (f) => await refreshView(),
                                //fab: 'S10',
                                //tbr: 'C',
                                //hideToolbarCaption: true
                            }
                        ]
                    }
                ]
            }
        }
    }

    function multiselectBasketOperations(items)
    {
        return {
                opver: 2,
                fab: 'M00',
                tbr: 'D',
                operations: [
                    {
                        caption: '_; Element; Elemento; Element',
                        operations: [
                            {
                            //    icon: FaTrash,
                                caption: '_; Remove from Clipboard; Eliminar del portapapeles; Usuń ze schowka',
                                action: (f) => dettachElementMulti(items),
                            //    fab:'M30',
                            //    tbr:'A'
                            }
                        ]
                    },

                    {
                        caption: '_; View; Ver; Widok',
                        operations: [
                            {
                                caption: '_; Select; Seleccionar; Zaznacz',
                                mricon: 'check-check',
                                hideToolbarCaption: true,
                                tbr: 'C',
                                fab: 'S20',
                                action: (f) => { listComponent.toggleMultiselection(); reloadPageToolbarOperations(getPageOperations()) },
                                active: true
                            },
                            {
                                caption: '_; Refresh; Actualizar; Odśwież',
                                action: async (f) => await refreshView(),
                            }
                        ]
                    }
                ]
        }
    }


    let attInput;
    let insertFileAfterElement = null;
    function runFileAttacher(after)
    {
        insertFileAfterElement = after
        attInput?.click();
    }

    async function onAttachementSelected()
    {
        const [file] = attInput.files;
        if(file)
        {
            pendingUploading = true

            const fileOrder = listComponent.assignOrder(insertFileAfterElement)

            let fileLink = await reef.post(`${contextPath}/CreateFile`,
                                    {
                                        title: file.name,
                                        mimeType: file.type,
                                        size: file.size,
                                        order: fileOrder
                                    }, onErrorShowAlert)
            if(!fileLink)
                return null;

            fileLink = fileLink.FolderFile

            const res = await reef.post(`UploadedFile/${fileLink.FileId}/Key/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
            if(res && res.key && res.uploadUrl)
            {
                const newKey = res.key;
                const uploadUrl = res.uploadUrl

                try
                {
                    //const res = await new Promise(r => setTimeout(r, 10000));
                    const res = await fetch(uploadUrl, {
                                                method: 'PUT',
                                                headers: new Headers({
                                                    'Content-Type': file.type
                                                }),
                                                body: file})
                    if(res.ok)
                    {
                        setBrowserRecentElement(fileLink.FileId, 'UploadedFile')
                    }
                    else
                    {
                        const err = await res.text()
                        console.error(err)
                        onErrorShowAlert(err)
                    }

                }
                catch(err)
                {
                    console.error(err)
                    onErrorShowAlert(err)
                }
            }

            pendingUploading = false;

            await fetchData();
            listComponent.reload(contextItem, fileLink.$ref);
        }
    }

    async function downloadFile(element)
    {
        //await new Promise(r => setTimeout(r, 5000));

        const res = await reef.fetch(`json/anyv/${element.href}`, onErrorShowAlert);
        if(res.ok)
        {
            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a"); // Or maybe get it from the current document
            link.href = blobUrl;
            link.download = element.Title;

            //document.body.appendChild(link); // Or append it whereever you want
            link.click() //can add an id to be specific if multiple anchor tag, and use #id


            URL.revokeObjectURL(blobUrl)

            setBrowserRecentElement(element.FileId, 'UploadedFile')
        }
        else
        {
            const err = await res.text()
            console.error(err)
            onErrorShowAlert(err)
        }
    }

    let folderPropertiesDialog;
    let filePropertiesDialog;
    let taskPropertiesDialog;
    let notePropertiesDialog;
    function runElementProperties(btt, aroundRect, element, kind)
    {
        switch(kind)
        {
        case 'Folder':
        case 'FolderFolder':
            folderPropertiesDialog.show(element)
            break;

        case 'Note':
        case 'FolderNote':
            notePropertiesDialog.show(element)
            break;

        case 'Task':
        case 'FolderTask':
            taskPropertiesDialog.show(element)
            break

        case 'UploadedFile':
        case 'FolderFile':
            filePropertiesDialog.show(element)
            break;
        }
    }

    let prev_folder_properties = {
        element:{
            icon: "icon",

            href: "href",
            Title: "Title",
            Summary: "Summary"
        },
        context:{
            FolderFile:{
                downloadable: true,
                onOpen: downloadFile
            }
        }

    }

    let folder_properties = {
        element:{
            Title: "Title",
            icon: "icon",
            micon: "#link",
            shaow_micon: 'IsShortcut',
            href: "href",

            Summary: "Summary"
        },
        context:{
            FolderFile:{
                downloadable: true,
                onOpen: downloadFile
            },
            FolderTask:{
                $properties: {
                    t:{l: ['ListName','#barcode', '&State'],
                       c: [],
                       r: [':DueDate']},
                    m:{},
                    b:{}
                }

            }
        }

    }

    let folder_properties_f = {
        element:{
            Title: "Title",
            icon: "icon",
            micon: "#link",
            shaow_micon: 'IsShortcut',
            href: "href",

            Summary: "Summary"
        },
        context:{
            FolderFile:{
                downloadable: true,
                onOpen: downloadFile
            },
            FolderTask:{
                $properties: {
                    t:[['ListName','#barcode', '&State'],
                       [],
                       ['DueDate']],
                    m:{},
                    b:{}
                }
            }
        }
    }


</script>

<svelte:head>
    {#if contextItem && folderTitle}
        <title>{folderTitle} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>


{#if contextItem}
    {#key contextPath}  <!-- to force new page operations -->
    <Page   self={contextItem}
            toolbarOperations={ getPageOperations() }
            clearsContext='props sel'
            title={folderTitle}>

        <Paper>
            <PaperHeader>
            <Breadcrumb  path = {contextItem.GetCanonicalPath}/>
            </PaperHeader>

            <!--div class="w-full flex flex-row justify-between">
                <span>Index 23</span>
                summary=
            </div-->

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
            {/if}


            <List    self={contextItem}
                    a='allElements'
                    list_properties = {folder_properties}
                    toolbarOperations={(el) => elementOperations(el, el.$type)}
                    {multiselectOperations}
                    orderAttrib='Order'
                    bind:this={listComponent}
                    component_id="main_list">

                <ListInserter   action={addElement} icon/>
            </List>



            <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>

        </Paper>

    </Page>
    {/key}
{:else}
    <Spinner delay={3000}/>
{/if}



<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        icon={FaTrash}
        onOkCallback={deleteElement}
        bind:this={deleteModal}>
    <p class="text-sm text-stone-500 dark:text-stone-300">
        {#if deleteObjectKind == 'multi' && objectToDelete.length > 1}
            {@const itemsNo = objectToDelete.length}
            {i18n({
                en: `Are you sure you want to delete ${itemsNo} elements?`,
                es: `¿Seguro que quieres eliminar ${itemsNo} elementos?`,
                pl: `Czy na pewno chcesz usunąć ${itemsNo} ${itemsNo < 5 ? 'elementy' : 'elementów'}?`})}
        {:else}
            <span>
                _;
                Are you sure you want to delete selected element?;
                ¿Está seguro de que desea eliminar el elemento seleccionado?;
                Czy na pewno chcesz usunąć wybrany element?
            </span>
        {/if}
    </p>
</Modal>

<Modal title={i18n(['Uploading...', 'Carga...', 'Przesyłanie...'])}
    bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={500}/>
    <span class="ml-3">_; Your file is uploading to the server; Tu archivo se está cargando en el servidor; Twój plik jest przesyłany na serwer</span>
</Modal>

<FolderProperties bind:this={folderPropertiesDialog} />
<FileProperties bind:this={filePropertiesDialog} />
<TaskProperties bind:this={taskPropertiesDialog} />
<NoteProperties bind:this={notePropertiesDialog} />