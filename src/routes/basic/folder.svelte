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
    import {FaRegFile, FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen, FaColumns, FaArchive, FaList, FaEllipsisH, FaChevronRight, FaChevronLeft} from 'svelte-icons/fa'
    import {location, pop, push, querystring} from 'svelte-spa-router'

    export let params = {}

    let contextItem = null;
    let contextPath;
    let contextItemId;
    let listComponent;
    let isArchivedList = false;
    let isArchivedTasks = false;
    let listTitle = ''
    
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
                                        Expressions:['Id','Title','Summary'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Folders',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Title',
                                                Expressions:['$ref', 'Title', 'href', 'fref']
                                                
                                            },
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Title',
                                                Expressions:['$ref', 'Title', 'href', 'fref']
                                                
                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);
        if(res)
        {    
            contextItem = res.Folder;
            listTitle = contextItem.Title;
        }
        else
            contextItem = null

         console.log(res)                       
         //
    }

    async function reloadTasks(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(contextItem, selectRecommendation);
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

        await reef.delete(taskToDelete.$ref, onErrorShowAlert);
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

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateTaskEx`,{ properties: newTaskAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.Task;
        await reloadTasks(newTask.Id)
    }

    function getPageOperations()
    {
        if(isArchivedList)
            return [];

        if(isArchivedTasks)
            return [];
        
        return [
                    {
                        icon: FaPlus,
                        action: (f) => { listComponent.addRowAfter(null) }
                    },
                    {
                        separator: true
                    },
                    {
                        icon: FaColumns,
                        right: true,
                        action: (f) => switchToKanban()
                    }
                ]
        
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

    let taskContextMenu = (task) => {
        let editOperations = getEditOperations(task);
        return {
            grid: editOperations
        }
    }

</script>


{#if contextItem}
    <Page   self={contextItem} 
            toolbarOperations={ getPageOperations() }
            clearsContext='props sel'
            title={listTitle}>
        <section class="w-full place-self-center max-w-3xl">
        <List   self={contextItem} 
                a='Folders'
                title={listTitle} 
                toolbarOperations={taskOperations} 
                contextMenu={taskContextMenu}
                orderAttrib='Title'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(folder) => `${folder.fref}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <span slot="left" let:element>
                <Icon component={FaRegFolder} 
                    class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
            </span>
        </List>
        <List   self={contextItem} 
                a='Notes'
                
                toolbarOperations={taskOperations} 
                contextMenu={taskContextMenu}
                orderAttrib='Title'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(note) => `${note.fref}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <span slot="left" let:element>
                <Icon component={FaRegFile} 
                    class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
            </span>
        </List>
    </section>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title="Delete"
        content="Are you sure you want to delete selected task?"
        icon={FaTrash}
        onOkCallback={deleteTask}
        bind:this={deleteModal}
        />

<Modal  title="Archive"
        content="Are you sure you want to archive selected task?"
        icon={FaArchive}
        onOkCallback={archiveTask}
        bind:this={archiveModal}
        />