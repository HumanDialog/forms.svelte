<script>
     import {reef} from '@humandialog/auth.svelte'
     import {
            editable, selectable, getNiceStringDateTime, startEditing, i18n,
            contextItemsStore, onErrorShowAlert,
			activateItem,
			isActive,
			isSelected,
			getActive, setSelectionAtEnd,

			Editable,

			focusEditable


        } from '$lib';
    import {tick} from 'svelte'
    import {link} from 'svelte-spa-router'
    import {FaPen, FaCaretUp, FaCaretDown} from 'svelte-icons/fa'
    import Task from './dashboard.task.svelte'


    export let list;
    export let tasks = undefined;
    export let getAllTags = undefined
    export let onUpdateAllTags = undefined
    export let users = []

    export let onRefreshDashboard = undefined

    let placeholder = ''

    $: isCardActive = calculate_active(list, $contextItemsStore)
    $: isCardSelected = selected(list, $contextItemsStore)

    $: selectedClass = isCardSelected ? "!border-blue-300 dark:!border-blue-300/50" : "";
    $: focusedClass = isCardActive ? "bg-stone-100 dark:bg-stone-700" : "";

    function calculate_active(...args)
    {
        return isActive('props', list)
    }

    function selected(...args)
    {
        return isSelected(list)
    }

    let operations = {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; List; Lista; Lista',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            mricon: 'pencil',
                            mricon: 'pencil',
                            fab: 'M20',
                            tbr: 'A',
                            grid: [
                                    {
                                        caption: '_; Title; Título; Tytuł',
                                        action: (focused) =>  { editProperty('Name') }
                                    },
                                    {
                                        caption: '_; Summary; Resumen; Podsumowanie',
                                        action: (focused) =>  { editProperty('Summary') }
                                    }
                            ]

                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            mricon: 'chevron-up',
                            mricon: 'chevron-up',
                            action: (f) => moveUp(),
                            fab: 'M05',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            mricon: 'chevron-down',
                            action: (f) => moveDown(),
                            fab: 'M04',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Follow; Seguir; Obserwuj',
                            action: (f) => UnSubscribe(),
                            active: true
                        },
                    /*    {
                            caption: '_; Archive; Archivar; Zarchiwizuj',
                            action: (f) => askToArchive(list)
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            action: (f) => askToDelete(list)
                        }
                    */
                    ]
                }

            ]
        }

    export function activate(e)
    {
        if(e)
            e.stopPropagation();

        if(isActive('props', list))
        {
            return;
        }

        activateItem('props', list, operations);
    }


    export async function editProperty(field)
    {
        if(field == "Name")
        {
            focusEditable('Name')
        }
        else if(field == "Summary")
        {
            if(!focusEditable('Summary'))
            {
                placeholder = 'Summary';
                await tick();
                focusEditable('Summary')
            }
        }
    }

    async function UnSubscribe()
    {
        const res = await reef.get(`${list.$ref}/List/Unsubscribe`, onErrorShowAlert)
        if(onRefreshDashboard)
            onRefreshDashboard()
    }

    async function moveUp()
    {
        await reef.get(`${list.$ref}/MoveUp`, onErrorShowAlert)
        if(onRefreshDashboard)
            onRefreshDashboard(list.$ref)
    }

    async function moveDown()
    {
        await reef.get(`${list.$ref}/MoveDown`, onErrorShowAlert)
        if(onRefreshDashboard)
            onRefreshDashboard(list.$ref)
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-interactions -->

{#if tasks && tasks.length > 0}

<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
{#if !isCardActive}
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!---- INACTIVE PURE LAYOUT ----------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<div        class = ""
            use:selectable={list}
            on:click={activate}>

    <h2>{list.Name}</h2>


    {#if list.Summary}
                <p>{list.Summary}</p>
    {/if}

    {#each tasks as task}
        <Task   {task}
                {getAllTags}
                {onUpdateAllTags}
                {users}/>
    {/each}
</div>







{:else}
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!---- ACTIVE WITH CONROLS  ----------------------------------------------------------------------->
<!------- keep pure layout  ----------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<div    class="bg-stone-100 dark:bg-stone-700/10 outline outline-8 outline-stone-100 dark:outline-stone-700/10"
        use:selectable={list}
        on:click={activate}>

    <a href={list.href} use:link>
    <h2  class="text-sky-500">
            <Editable self={list} a='Name' focusOnClick={false}/>
    </h2>
    </a>



    {#if list.Summary || placeholder == 'Summary'}
                <p>
                    <Editable self={list} a='Summary'/>
                </p>
    {/if}

    {#each tasks as task}
        <Task   {task}
                {getAllTags}
                {onUpdateAllTags}
                {users}/>
    {/each}
</div>
{/if}
{/if}