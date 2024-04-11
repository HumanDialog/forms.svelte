<script>
    import {reef} from '@humandialog/auth.svelte'
    import {location, push} from 'svelte-spa-router'
    import {
		Page,
		Kanban,
		KanbanColumn,
		KanbanTitle,
		KanbanSummary,
		Spinner,
		DatePicker,
		Combo,
		ComboSource,
		KanbanCallckacks,
		KanbanColumnTop,
		KanbanColumnBottom,
        mainViewReloader,

		KanbanSource

	} from '$lib';
    import {FaPlus, FaList} from 'svelte-icons/fa'
    import Tags from './tags.svelte'

    export let params = {}

    let currentList = null;
    
    let listId = '';
    let listPath = '';

    let users = [];
    let taskStates = [];
    let allTags = ''
    let kanban;

    $: onParamsChanged($location, $mainViewReloader);

	async function onParamsChanged(...args) 
    {
        const segments = $location.split('/');
        
        const foundIdx = segments.findIndex( s => s == 'listboard');
        if(foundIdx < 0)
            return;

        if(users.length == 0)
        {
            let res = await reef.get('/app/Users')
            if(res)
                users = res.User;
        }

        allTags = await reef.get('/app/AllTags');
        
        if(!segments.length)
            listId = 'first';
        else
            listId = segments[segments.length-1]
        
        currentList = null

        listPath = `/app/Lists/${listId}`;
        await fetchData()
    }

    async function fetchData()
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
                                        Expressions:['Id','Name','TaskStates','$type'],
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
        {
            currentList = null
            return;
        }

        if(currentList.TaskStates)
        {
            try{
                taskStates = JSON.parse(currentList.TaskStates);
            }
            catch(e)
            {
                taskStates = [];
            }
        }
        else
            taskStates = [];
    }

    let pageOperations = [
        {
            caption: 'Column',
            icon: FaPlus,
            action: (f) => addColumn('New column')
        },
        {
            caption: 'List view',
            icon: FaList,
            action: (f) => switchToList()
        }
    ];

    async function addColumn(name)
    {
        let maxStateValue=0;
        for(let i=0; i<taskStates.length; i++)
        {
            const taskState = taskStates[i];
            if(taskState.state > maxStateValue)
                maxStateValue = taskState.state;
        }

        taskStates = [...taskStates, {
                state: maxStateValue+1,
                name: name
            }];

        currentList.TaskStates = JSON.stringify(taskStates);
        
        await reef.post(`${listPath}/set`,
                    {
                        TaskStates: currentList.TaskStates
                    });
    }

    function switchToList()
    {
        push(`/tasklist/${listId}`);
    }
  
	function onAdd(title, columnIdx, afterElement) 
    {
        
	}

	function onRemove(item)
    {
        
	}

	
    function onOpen(item)
    {
        push(`task?ref=${item.$ref}`);
    }


</script>

{#if currentList}
	<Page
		self={currentList}
		cl="!bg-white dark:!bg-stone-900 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden py-1 px-1 border-0"
		toolbarOperations={pageOperations}
		clears_context="props sel"
		title={currentList.Name}
	>
		<Kanban class="grow-0" 
                title={currentList.Name} 
                bind:this={kanban}>

            <KanbanSource self={currentList}
                          a='Tasks'
                          stateAttrib='State'
                          orderAttrib='ListOrder'/>

            {#each taskStates as taskState (taskState.state)}
                <KanbanColumn title={taskState.name} state={taskState.state} />
            {/each}

			<KanbanCallckacks {onAdd} {onRemove} {onOpen}/>

			<KanbanTitle a="Title"/>
			<KanbanSummary a="Summary" />

			<!--   ================== kanbanCardTopProps ================== -->
			<svelte:fragment slot="kanbanCardTopProps" let:element={task}>
				{#if task.Index}
                    <p
                        class="     h-6
                                    sm:text-xs sm:min-h-[1rem]
                                    text-base min-h-[1.5rem]
                                    text-stone-400
                                    text-right">
                        {task.Index}
                    </p>
                {/if}

				{#if task.DueDate}
					<DatePicker
						self={task}
						a="DueDate"
						compact={true}
						s="xs"
						inContext="props"/>
				{/if}
			</svelte:fragment>

			<!--   ================== kanbanCardMiddleProps ================== -->
			<section slot="kanbanCardMiddleProps" let:element={task} class="grow-0">
				{#if task.Actor}
					<Combo
						compact={true}
						inContext="props"
						self={task}
						a="Actor"
						isAssociation
						icon={false}
						s="xs">
						<ComboSource objects={users} key="$ref" name="Name" />
					</Combo>
				{/if}
			</section>

			<!--   ================== kanbanCardBottomProps ================== -->
            <svelte:fragment slot="kanbanCardBottomProps" let:element={task}>
                {#if task.Tags}
                    <Tags
                        class="mt-2"
                        tags={task.Tags}
                        globalTags={allTags}
                        s="xs"
                    />
                {/if}
            </svelte:fragment>
			
		</Kanban>
	</Page>
{:else}
	<Spinner delay={3000} />
{/if}
