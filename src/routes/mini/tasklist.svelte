<script>
    import {reef} from '@humandialog/auth.svelte'
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
				mainViewReloader} from '$lib'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen} from 'svelte-icons/fa'
    import {location} from 'svelte-spa-router'

    export let params = {}

    let currentList = null;
    let dataPath;
    let listComponent;

    let users = [];

    const STATUS_CLOSED = 2;
    
    $: onParamsChanged($location, $mainViewReloader);
    
    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'tasklist');
        if(foundIdx < 0)
            return;

        if(users.length == 0)
        {
            let res = await reef.get('/app/Users')
            if(res)
                users = res.User;
        }
        
        
        let listId;
        if(!segments.length)
            listId = 'first';
        else
            listId = segments[segments.length-1]
        
        currentList = null

        dataPath = `/app/Lists/${listId}/query`;
        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(dataPath,
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
                                                Association: 'Tasks',
                                                Filter: 'Status <> STATUS_CLOSED',
                                                Sort: 'ListOrder',
                                                //ShowReferences: true,
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
                            });
        if(res)
            currentList = res.TaskList;
        else
            currentList = null
    }

    async function reloadTasks(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(currentList, selectRecommendation);
    }
    

    async function deleteTask(task)
    {
        await reef.delete(task.$ref);
        await reloadTasks(listComponent.SELECT_NEXT)

    }

    async function finishTask(event, task)
    {
        event.stopPropagation();

        let result = await reef.get(`${task.$ref}/Finish`);
        if(result)
            await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)   
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`/app/Lists/${currentList.Id}/Tasks/new`, newTaskAttribs)
        if(!res)
            return null;

        let newTask = res.Task[0];
        await reloadTasks(newTask.Id)
    }

    let pageOperations = [
        {
            icon: FaPlus,
            caption: '',
            action: (focused) => { listComponent.addRowAfter(null) }
        }
    ]

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
                    caption: '',
                    action: (focused) => { listComponent.addRowAfter(task) }
                },
                {
                    icon: FaPen,
                    caption: '',
                    grid: editOperations
                },
                {
                    caption: '',
                    icon: FaCaretUp,
                    action: (focused) => listComponent.moveUp(task)
                },
                {
                    caption: '',
                    icon: FaCaretDown,
                    action: (focused) => listComponent.moveDown(task)
                },
                {
                    caption: '',
                    icon: FaTrash,
                    action: (focused) => deleteTask(task)
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


{#if currentList}
    <Page   self={currentList} 
            cl="!bg-white dark:!bg-stone-900 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden py-1 px-1 border-0" 
            toolbarOperations={pageOperations}
            clears_context='props sel'
            title={currentList.Name}>

        <List   self={currentList} 
                a='Tasks' 
                title={currentList.Name} 
                toolbarOperations={taskOperations} 
                contextMenu={taskContextMenu}
                orderAttrib='ListOrder'
                bind:this={listComponent}>
            <ListTitle a='Title'/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <ListComboProperty  name="Actor" association>
                <ComboSource objects={users} key="$ref" name='Name'/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>

            <span slot="left" let:element>
                <Icon component={element.Status == STATUS_CLOSED ? FaRegCheckCircle : FaRegCircle} 
                    on:click={(e) => finishTask(e, element)} 
                    class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
            </span>

            
        </List>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


