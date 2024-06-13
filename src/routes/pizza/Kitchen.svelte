<script>
    import {reef} from '@humandialog/auth.svelte'
    import {Page, Kanban, KanbanSource, KanbanColumn, KanbanCallbacks, KanbanTitle, KanbanSummary, Button} from '$lib'
    import { onMount } from 'svelte';
    import {STATE_WAITING_FOR_BAKING_PIZZA, STATE_BAKING_PIZZA, STATE_PIZZA_BAKED} from './main'

    onMount( async () => {
        await loadData();
        return () => {} 
    })

    let chefList;
    let kanban;

    async function loadData()
    {
        const res = await reef.get('app/ActivePizzaChefTasks')
        if(res)
            chefList =  res.TaskList;
    }

    async function refresh(selection = undefined)
    {
        await loadData();
        kanban.reload(chefList, selection);
    }

    
    function getCardOperations(task)
    {
        switch(task.State)
        {
        case STATE_WAITING_FOR_BAKING_PIZZA:
            return [{
                caption: 'Start baking',
                action: async (f) => await startBaking(task)
            }]
            
        case STATE_BAKING_PIZZA:
            return [{
                caption: 'End baking',
                action: async (f) => await endBaking(task)
            }]

        case STATE_PIZZA_BAKED:
            return []

        }

        return [];
    }

    async function startBaking(task)
    {
        await reef.post(`${task.$ref}/Process/StartBakingPizza`, {})
        await refresh(task.Id);
    }

    async function endBaking(task)
    {
        await reef.post(`${task.$ref}/Process/EndBakingPizza`, {})
        await refresh(task.Id);
    }

    const pageOperations = [{
        caption: 'Refresh',
        action: async (f) => await refresh()
    }]


    function buttonClick(task)
    {
        console.log('buttonClick', task)
    }


</script>

<svelte:head>
    <title>Chef's panel</title>
</svelte:head>

{#if chefList}

<Page
		self={chefList}
		clearsContext="props sel"
        toolbarOperations={pageOperations}
		title={chefList.Name}>
    <h1 class="text-4xl font-extrabold dark:text-white mb-4 text-center">{chefList.Name}</h1>

    <section class="flex flex-row gap-4 justify-center">
        <Button context="props"
                action={startBaking}
                class=" bg-blue-400 hover:bg-blue-500 disabled:bg-stone-400
                        dark:bg-blue-600 dark:highlight-white/20 dark:hover:bg-blue-500 disabled:dark:bg-stone-700
                        mt-3 px-6
                        text-white font-semibold 
                        h-20 w-30 rounded-lg  
                        flex items-center justify-center
                        cursor-pointer disabled:cursor-default"
                    disabledFunc={(task) => task.State != STATE_WAITING_FOR_BAKING_PIZZA}>
                Start baking
        </Button>

        <Button context="props"
                action={endBaking}
                class=" bg-blue-600 hover:bg-blue-700 disabled:bg-stone-400
                        dark:bg-blue-800 dark:highlight-white/20 dark:hover:bg-blue-700 disabled:dark:bg-stone-700
                        mt-3 px-6
                        text-white font-semibold 
                        h-20 w-30 rounded-lg  
                        flex items-center justify-center
                        cursor-pointer disabled:cursor-default"
                    disabledFunc={(task) => task.State != STATE_BAKING_PIZZA}>
                End baking
        </Button>

        <Button action={refresh}
                class=" bg-green-600 hover:bg-green-700 disabled:bg-stone-400
                        dark:bg-green-800 dark:highlight-white/20 dark:hover:bg-green-700 disabled:dark:bg-stone-700
                        mt-3 px-6
                        text-white font-semibold 
                        h-20 w-30 rounded-lg  
                        flex items-center justify-center
                        cursor-pointer disabled:cursor-default">
                Refresh
        </Button>

    </section>
    <Kanban class="grow-0" 
                bind:this={kanban}>

            <KanbanSource self={chefList}
                          a='Tasks'
                          stateAttrib='State'
                          orderAttrib='ListOrder'/>

            
            <KanbanColumn   title="Waiting" state={STATE_WAITING_FOR_BAKING_PIZZA}/>
            <KanbanColumn   title="Baking" state={STATE_BAKING_PIZZA}/>
            <KanbanColumn   title="Baked" state={STATE_PIZZA_BAKED} finishing/>
            
			<KanbanCallbacks {getCardOperations}/>

			<KanbanTitle a="Title"/>
			<KanbanSummary a="Summary" />

        </Kanban>

</Page>


{:else}
    <p>Loading chef's data...</p>
{/if}
