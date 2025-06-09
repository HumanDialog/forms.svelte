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
				mainContentPageReloader} from '$lib'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCalendar, FaPen} from 'svelte-icons/fa'

    export let params = {}

    let user = null;
    let listComponent;

    let lists = [];
    const STATUS_CLOSED = 2;

    $: onParamsChanged($session, $mainContentPageReloader);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        if(lists.length == 0)
        {
            let res = await reef.get('/app/Lists')
            if(res)
                lists = res.TaskList;
        }


        await fetchData()
    }

    async function fetchData()
    {
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
                                            Expressions:['Id','Name'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'MyTasks',
                                                    Filter: 'Status <> STATUS_CLOSED',
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
                                });
        if(res)
            user = res.User;
        else
            user = null
    }

    async function reloadTasks(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(user, selectRecommendation);
    }


    async function deleteTask(task)
    {
        await reef.delete(task.$ref);
        await reloadTasks(listComponent.SELECT_NEXT)

    }

    async function finishTask(event, task)
    {
        event.stopPropagation();

        let result = await reef.post(`${task.$ref}/Finish`, {});
        if(result)
            await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)
    }

    async function addTask(newTaskAttribs)
    {
        let newTask = await reef.post(`/user/MyTasks/new`, newTaskAttribs)
        if(!newTask)
            return null;

        return newTask.Task[0];
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
                caption: 'List',
                action: (focused) => { listComponent.edit(task, 'TaskList') }
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


{#if user}
    <Page   self={user}
            cl="!bg-white dark:!bg-stone-900 w-full flex flex-col overflow-x-hidden py-1 px-1 border-0"
            toolbarOperations={pageOperations}
            clearsContext='props sel'>

        <List   self={user}
                a='MyTasks'
                toolbarOperations={taskOperations}
                contextMenu={taskContextMenu}
                orderAttrib='UserOrder'
                bind:this={listComponent}>
            <ListTitle a='Title'/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <ListComboProperty  name="TaskList" association>
                <ComboSource objects={lists} key="$ref" name='Name'/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>

            <span slot="left" let:element>
                <Icon component={element.Status == STATUS_CLOSED ? FaRegCheckCircle : FaRegCalendar}
                    on:click={(e) => finishTask(e, element)}
                    class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
            </span>


        </List>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}
