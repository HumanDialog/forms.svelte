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
				activateItem, UI,
				showFloatingToolbar} from '$lib'
    import {FaRegFile, FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen, FaColumns, FaArchive, 
        FaList, FaEllipsisH, FaChevronRight, FaChevronLeft, FaRegShareSquare, FaLink, FaUnlink, FaRegStar, FaStar, FaShoppingBasket, FaCopy, FaCut} from 'svelte-icons/fa'
    import {location, pop, push, querystring} from 'svelte-spa-router'
    import BasketPreview from './basket.preview.svelte'

    export let params = {}

    let contextItem = null;
    let contextPath;
    let contextItemId;
    let subfoldersComponent;
    let notesComponent;
    let tasksComponent;
    let folderTitle = ''

    let users = [];

    const STATE_FINISHED = 1000;
    
    $: onParamsChanged($location, $querystring, $mainContentPageReloader);
    
    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'folder');
        if(foundIdx < 0)
            return;
        
        
        if(!segments.length)
            contextItemId = 'first';
        else
            contextItemId = segments[segments.length-1]
        
        
        
        contextItem = null
        contextPath = `/Folder/${contextItemId}` 
     
            
        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(`/Folder/${contextItemId}/query`,
                            {
                                Id: 1,
                                Name: "collector",
                                ExpandLevel: 3,
                                Tree:
                                [
                                    {
                                        Id: 1,
                                        Association: '',
                                        Expressions:['Id', '$ref','Title','Summary', 'IsPinned', 'IsBasket'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Folders',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Order',
                                                Expressions:['Id','$ref', 'Title', 'Summary', 'Order', 'href', 'IsPinned']
                                                
                                            },
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Order',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href']
                                                
                                            },
                                            {
                                                Id: 4,
                                                Association: 'Tasks',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Order',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'State', 'href']
                                                
                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);
        if(res)
        {    
            contextItem = res.Folder;
            folderTitle = contextItem.Title;
        }
        else
            contextItem = null

    }

   

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
            await reef.post(`${contextItem.$ref}/DeletePermanentlyTask`, { taskLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
            break;

        case 'Note':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyNote`, { noteLink: objectToDelete.$ref } , onErrorShowAlert);  
            deleteModal.hide();
            await fetchData();
            notesComponent.reload(contextItem, notesComponent.SELECT_NEXT);
            break;

        case 'Folder':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyFolder`, { folderLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            subfoldersComponent.reload(contextItem, subfoldersComponent.SELECT_NEXT);
            break;
        }
        
    }

    async function dettachSubFolder(folder)
    {
        await reef.post(`${contextItem.$ref}/DettachSubFolder`, { folderLink: folder.$ref } , onErrorShowAlert);
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.SELECT_NEXT);
    }

    async function dettachNote(note)
    {
        await reef.post(`${contextItem.$ref}/DettachNote`, { noteLink: note.$ref } , onErrorShowAlert);
        await fetchData();
        notesComponent.reload(contextItem, notesComponent.SELECT_NEXT);
    }

    async function dettachTask(task)
    {
        await reef.post(`${contextItem.$ref}/DettachTask`, { taskLink: task.$ref } , onErrorShowAlert);
        await fetchData();
        tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function copyTaskToBasket(task)
    {
        await reef.post(`${contextItem.$ref}/CopyTaskToBasket`, { taskLink: task.$ref } , onErrorShowAlert);
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutTaskToBasket(task)
    {
        await reef.post(`${contextItem.$ref}/CutTaskToBasket`, { taskLink: task.$ref } , onErrorShowAlert);
        await fetchData();
        tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function copyNoteToBasket(note)
    {
        await reef.post(`${contextItem.$ref}/CopyNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutNoteToBasket(note)
    {
        await reef.post(`${contextItem.$ref}/CutNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        await fetchData();
        notesComponent.reload(contextItem, notesComponent.SELECT_NEXT);
    }

    async function copySubFolderToBasket(folder)
    {
        await reef.post(`${contextItem.$ref}/CopySubFolderToBasket`, { folderLink: folder.$ref } , onErrorShowAlert);
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutSubFolderToBasket(folder)
    {
        await reef.post(`${contextItem.$ref}/CutSubFolderToBasket`, { folderLink: folder.$ref } , onErrorShowAlert);
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.SELECT_NEXT);
    }

    async function finishTask(event, task)
    {
        if(event)
            event.stopPropagation();

        let result = await reef.post(`${task.$ref}/Finish`, {}, onErrorShowAlert);
        if(result)
        {
            await fetchData();
            tasksComponent.reload(contextItem, tasksComponent.KEEP_OR_SELECT_NEXT);
        }
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateTaskEx`,{ properties: newTaskAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.FolderTask;

        await fetchData();
        tasksComponent.reload(contextItem, newTask.Id);
    }

    async function addNote(newNoteAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateNoteEx`,{ properties: newNoteAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newNote = res.FolderNote;

        await fetchData();
        notesComponent.reload(contextItem, newNote.Id);
    }

    async function addFolder(newFolderAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateSubFolderEx`,{ properties: newFolderAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newFolder = res.FolderFolder;

        await fetchData();
        subfoldersComponent.reload(contextItem, newFolder.Id);
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

    async function dettachAllMyContent()
    {
        await reef.post(`${contextItem.$ref}/DettachAllContent`, {} , onErrorShowAlert)
        
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.CLEAR_SELECTION)
        notesComponent.reload(contextItem, notesComponent.CLEAR_SELECTION)
        tasksComponent.reload(contextItem, tasksComponent.CLEAR_SELECTION)
    }

    function getPageOperations()
    {
        if(!contextItem)
            return [];

        if(contextItem.IsBasket)
        {
            return {
                opver: 1,
                operations: [
                    {
                        caption: 'View',
                        operations: [
                            {
                                caption: 'Clear Basket',
                                icon: FaTrash,
                                action: async (f) => await dettachAllMyContent(),
                                fab: 'M30',
                                tbr: 'A'
                            }
                        ]
                    }
                ]
            }
        }
        else
        {
            let pinOperation;
            if(contextItem.IsPinned)
            {
                pinOperation = {
                    icon: FaStar, //aRegShareSquare, // 
                    action: async (f) => { 
                        await toggleFolderPinned(contextItem); 
                        // refreshing operations
                        activateItem('data', contextItem, getPageOperations());
                        if(UI.navigator)
                            UI.navigator.refresh()
                      },
                    fab: 'S00',
                    tbr: 'C'
                }
            }
            else
            {
                pinOperation = {
                    icon: FaRegStar, //aRegShareSquare, // 
                    action: async (f) => { 
                        await toggleFolderPinned(contextItem); 
                        // refreshing operations 
                        activateItem('data', contextItem, getPageOperations());
                        if(UI.navigator)
                            UI.navigator.refresh()
                    },
                    fab: 'S00',
                    tbr: 'C'
                }
            }

            
            return {
                opver: 1,
                operations: [
                    {
                        caption: "View",
                        operations: [
                            {
                                icon: FaPlus,
                                menu: [
                                    {
                                        caption: 'New folder',
                                        icon: FaRegFolder,
                                        action: (f) => { subfoldersComponent.addRowAfter(null) }
                                    },
                                    {
                                        caption: 'New note',
                                        icon: FaRegFile,
                                        action: (f) => { notesComponent.addRowAfter(null) }
                                    },
                                    {
                                        caption: 'New task',
                                        icon: FaRegCircle,
                                        action: (f) => { tasksComponent.addRowAfter(null) }
                                    }
                                ],
                                fab: 'M10',
                                tbr: 'A'
                            },
                            {
                                caption: 'Attach...',
                                icon: FaShoppingBasket, //FaLink, //aRegShareSquare, // 
                                toolbar: BasketPreview,
                                props: {
                                    destinationFolder: contextItem.$ref,
                                    onRefreshView: refreshViewAfterAttachingFromBasket
                                },
                                fab: 'M01',
                                tbr: 'A'
                            },
                            pinOperation
                        
                        ]
                    }
                ]
            }
        }
    }

    async function refreshViewAfterAttachingFromBasket(f)
    {
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.CLEAR_SELECTION)
        notesComponent.reload(contextItem, notesComponent.CLEAR_SELECTION)
        tasksComponent.reload(contextItem, tasksComponent.CLEAR_SELECTION)
    }
    

    function switchToKanban()
    {
        push(`/listboard/${contextItemId}`);
    }

    function listComponent(kind)
    {
        switch(kind)
        {
        case 'Task':
            return tasksComponent;
        case 'Note':
            return notesComponent;
        case 'Folder':
            return subfoldersComponent
        }
    }

    function getEditOperations(obj, kind)
    {
        return [
            {
                caption: 'Title',
                action: (focused) =>  { listComponent(kind).edit(obj, 'Title') }
            },
            {
                caption: 'Summary',
                action: (focused) =>  { listComponent(kind).edit(obj, 'Summary') }
            }
        ];
    }


    async function dettachElement(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
            return dettachSubFolder(element)
        case 'Note':
            return dettachNote(element)
        case 'Task':
            return dettachTask(element)
        }   
    }
    
    async function copyElementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
            return copySubFolderToBasket(element)
        case 'Note':
            return copyNoteToBasket(element)
        case 'Task':
            return copyTaskToBasket(element)
        }   
    }

    async function cutElementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
            return cutSubFolderToBasket(element)
        case 'Note':
            return cutNoteToBasket(element)
        case 'Task':
            return cutTaskToBasket(element)
        }   
    }

    let elementOperations = (element, kind) => {
        let list = listComponent(kind)
        
        if(contextItem.IsBasket)
        {
            return {
                opver: 1,
                operations: [
                    {
                        caption: kind,
                        operations: [
                            {
                                icon: FaCaretDown,
                                action: (f) => list.moveDown(element),
                                fab:'M02',
                                tbr:'A' 
                            },
                            {
                                icon: FaCaretUp,
                                action: (f) => list.moveUp(element),
                                fab:'M03',
                                tbr:'A' 
                            },
                            {
                                icon: FaTrash,
                                caption: 'Remove from Basket',
                                action: (f) => dettachElement(element, kind),
                                fab:'M30',
                                tbr:'B'
                            }
                        ]
                    }
                ]
            }
        }
        else
        {
            let editOperations = getEditOperations(element, kind)

            return {
                opver: 1,
                operations: [
                    {
                        caption: kind,
                        operations: [
                            {
                                icon: FaPlus,
                                action: (f) => { list.addRowAfter(element) },
                                fab:'M10',
                                tbr:'A' 
                            },
                            {
                                icon: FaPen,
                                grid: editOperations,
                                fab:'M20',
                                tbr:'A' 
                            },
                            {
                                icon: FaCaretDown,
                                action: (f) => list.moveDown(element),
                                fab:'M02',
                                tbr:'A' 
                            },
                            {
                                icon: FaCaretUp,
                                action: (f) => list.moveUp(element),
                                fab:'M03',
                                tbr:'A' 
                            },
                            {
                                icon: FaCopy,
                                caption: 'Copy to basket',
                                action: (f) => copyElementToBasket(element, kind),
                                fab: 'M05',
                                tbr: 'A'

                            },
                            {
                                icon: FaCut,
                                caption: 'Move to basket',
                                action: (f) => cutElementToBasket(element, kind),
                                fab: 'M04',
                                tbr: 'A'
                            },
                            {
                                icon: FaTrash,
                                menu: [
                                    {
                                        caption: 'Dettach',
                                        icon: FaUnlink,
                                        action: (f) => dettachElement(element, kind)
                                    },
                                    {
                                        caption: 'Delete permanently',
                                        icon: FaTrash,
                                        action: (f) => askToDelete(element, kind)
                                    }
                                ],
                                fab:'M30',
                                tbr:'B'
                            }
                        ]
                    }
                ]
            }
        }
    }


</script>


{#if contextItem}
    <Page   self={contextItem} 
            toolbarOperations={ getPageOperations() }
            clearsContext='props sel'
            title={folderTitle}>

            <section class="w-full place-self-center max-w-3xl">
        
            <List   self={contextItem} 
                    a='Folders'
                    title={folderTitle} 
                    toolbarOperations={(el) => elementOperations(el, 'Folder')} 
                    orderAttrib='Order'
                    bind:this={subfoldersComponent}>
                <ListTitle a='Title' hrefFunc={(folder) => `${folder.href}`}/>
                <ListSummary a='Summary'/>
                <ListInserter action={addFolder} icon/>

                <span slot="left" let:element>
                    <Icon component={FaRegFolder} 
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
                </span>
            </List>
        
            <List   self={contextItem} 
                    a='Notes'
                    toolbarOperations={ (el) => elementOperations(el, 'Note')} 
                    orderAttrib='Order'
                    bind:this={notesComponent}>
                <ListTitle a='Title' hrefFunc={(note) => `${note.href}`}/>
                <ListSummary a='Summary'/>
                <ListInserter action={addNote} icon/>

                <span slot="left" let:element>
                    <Icon component={FaRegFile} 
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
                </span>
            </List>
        
            <List   self={contextItem} 
                    a='Tasks'
                    toolbarOperations={(el) => elementOperations(el, 'Task')} 
                    orderAttrib='Order'
                    bind:this={tasksComponent}>
                <ListTitle a='Title' hrefFunc={(task) => `${task.href}`}/>
                <ListSummary a='Summary'/>
                <ListInserter action={addTask} icon/>

                <span slot="left" let:element>
                    {#if element.State == STATE_FINISHED}
                        <Icon component={FaRegCheckCircle} 
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
                        
                    {:else}
                        <Icon component={FaRegCircle} 
                            on:click={(e) => finishTask(e, element)} 
                            class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
                        
                    {/if}
                </span>
            </List>
        
    </section>

    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title="Delete"
        content="Are you sure you want to delete selected element?"
        icon={FaTrash}
        onOkCallback={deleteElement}
        bind:this={deleteModal}
        />

