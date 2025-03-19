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
                onErrorShowAlert} from '$lib'
    import {FaRegFile, FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen, FaColumns, FaArchive, 
        FaList, FaEllipsisH, FaChevronRight, FaChevronLeft, FaRegShareSquare, FaLink, FaRegStar, FaStar} from 'svelte-icons/fa'
    import {location, pop, push, querystring} from 'svelte-spa-router'

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
        console.log('cp:',contextPath)
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

        await reef.delete(folderToDelete.$ref, onErrorShowAlert);
        deleteModal.hide();

        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.SELECT_NEXT);
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
        
        await fetchData();
        tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
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
        let res = await reef.post(`${contextPath}/CreateTaskUI`,{ properties: newTaskAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.FolderTask;

        await fetchData();
        tasksComponent.reload(contextItem, newTask.Id);
    }

    async function addNote(newNoteAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateNoteUI`,{ properties: newNoteAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newNote = res.FolderNote;

        await fetchData();
        notesComponent.reload(contextItem, newNote.Id);
    }

    async function addFolder(newFolderAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateSubFolderUI`,{ properties: newFolderAttribs }, onErrorShowAlert)
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
                                action: (f) => console.log('TODO: clear basket', contextItem),
                                fab: 'M20',
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
                    action: async (f) => { await toggleFolderPinned(contextItem)  },
                    fab: 'M30',
                    tbr: 'C'
                }
            }
            else
            {
                pinOperation = {
                    icon: FaRegStar, //aRegShareSquare, // 
                    action: async (f) => { await toggleFolderPinned(contextItem)  },
                    fab: 'M30',
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
                                icon: FaLink, //aRegShareSquare, // 
                                action: (f) => { console.log('Attach...')  },
                                fab: 'M20',
                                tbr: 'A'
                            },
                            pinOperation
                        
                        ]
                    }
                ]
            }
        }
    }
    

    function switchToKanban()
    {
        push(`/listboard/${contextItemId}`);
    }

    function getEditOperations(task)
    {
        return [
            {
                caption: 'Name',
                action: (focused) =>  { listComponent.edit(task, 'Title') }
            },
            {
                caption: 'Summary',
                action: (focused) =>  { listComponent.edit(task, 'Summary') }
            },
            {
                separator: true
            },
            {
                caption: 'Responsible',
                action: (focused) => { listComponent.edit(task, 'Actor') }
            },
            {
                caption: 'Due Date',
                action: (focused) => { listComponent.edit(task, 'DueDate') }
            }

        ];
    }

    
    let taskOperations = (task) => { 
        let editOperations = getEditOperations(task)
        return [
                {
                    icon: FaPlus,
                    action: (f) => { listComponent.addRowAfter(task) }
                },
                {
                    toolbox:[
                        {
                            icon: FaPen,
                            grid: editOperations
                        },
                        {
                            icon: FaEllipsisH,
                            menu:[
                                {
                                    icon: FaArchive,
                                    caption: 'Archive',
                                    action: (f) => askToArchive(task)
                                },
                                {
                                    icon: FaTrash,
                                    caption: 'Delete',
                                    action: (f) => askToDelete(task)
                                }
                            ]
                        }
                        
                    ]
                },
                {
                    icon: FaCaretDown,
                    action: (f) => listComponent.moveDown(task)
                },
                {
                    icon: FaCaretUp,
                    action: (f) => listComponent.moveUp(task)
                },
                {
                    icon: FaColumns,
                    right: true,
                    action: (f) => switchToKanban()
                }
            ];
    }

    let subfolderOperations = (subfolder) => { 
        return {
            opver: 1,
            operations: [
                {
                    caption: 'Folder',
                    operations: [
                        {
                            icon: FaTrash,
                            action: (f) => console.log('TODO: delete folder', subfolder),
                            fab: 'M20',
                            tbr: 'A'
                        }
                    ]
                }
            ]
        }
    }

    let noteOperations = (note) => {
        return { 
            opver: 1,
            operations: [
                {
                    caption: 'Note',
                    operations: [
                        {
                            icon: FaTrash,
                            action: (f) => {console.log('TODO: delete note', note) },
                            fab: 'M20',
                            tbr: 'A'
                        }
                    ]
                }
            ]
        }
    }

</script>


{#if contextItem}
    <Page   self={contextItem} 
            toolbarOperations={ getPageOperations() }
            clearsContext='props sel'
            title={folderTitle}>

        <!--section-->
            <List   self={contextItem} 
                    a='Folders'
                    title={folderTitle} 
                    toolbarOperations={subfolderOperations} 
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
        <!--/section-->

        <!--section-->
            <List   self={contextItem} 
                    a='Notes'
                    toolbarOperations={noteOperations} 
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
        <!--/section-->
        
        <!--section-->
            <List   self={contextItem} 
                    a='Tasks'
                    toolbarOperations={taskOperations} 
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
        <!---/section-->

    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title="Delete"
        content="Are you sure you want to delete selected task?"
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />

<Modal  title="Archive"
        content="Are you sure you want to archive selected task?"
        icon={FaArchive}
        onOkCallback={archiveTask}
        bind:this={archiveModal}
        />