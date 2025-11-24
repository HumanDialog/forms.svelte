<script>
     import {reef} from '@humandialog/auth.svelte'
     import {  
            editable, selectable, getNiceStringDateTime, startEditing, i18n,
            contextItemsStore, onErrorShowAlert,
			activateItem,
			isActive,
			isSelected,
			getActive, setSelectionAtEnd
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
    let nameElement;
    let summaryElement;
    
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
                            icon: FaPen,
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
                            icon: FaCaretUp,
                            action: (f) => moveUp(),
                            fab: 'M05',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            icon: FaCaretDown,
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

    async function changeListProperty(value, propName)
    {
        list[propName] = value

        switch(propName)
        {
        case 'Name':
            await reef.post(`${list.$ref}/SetName`, { value: value }, onErrorShowAlert)
            break;

        case 'Summary':
            await reef.post(`${list.$ref}/SetSummary`, { value: value }, onErrorShowAlert)
            break;
        }

    }

    export async function editProperty(field)
    {
        if(field == "Name")
        {
            startEditing(nameElement);
        }
        else if(field == "Summary")
        {
            if(summaryElement)
            {
                summaryElement.focus();
                await tick();
                setSelectionAtEnd(summaryElement)
            }
            else
            {
                placeholder = 'Summary';
                await tick();
                if(summaryElement)
                    summaryElement.focus();
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
<section    class="relative left-[-0.25rem] pl-1 rounded-md border border-transparent {selectedClass} {focusedClass}"
            use:selectable={list}
            on:click={activate}>
    <h3>
        {#if isCardActive}
            <a href={list.href} use:link
                use:editable={{
                                action: (text) => changeListProperty(text, 'Name'), 
                                active: false,
                                onFinish: (d) => {nameElement.blur()}}}
                            bind:this={nameElement}>
                {list.Name}
            </a>
        {:else}
            <span>{list.Name}</span>
        {/if}
    </h3>
    
    {#if list.Summary || placeholder == 'Summary'}
        <p>
            {#if isCardActive}
                <span  use:editable={{
                                    action: (text) => changeListProperty(text, 'Summary'), 
                                    active: true,
                                    onFinish: (d) => {placeholder = ''}}}
                                bind:this={summaryElement}>
                    {list.Summary}
                </span>
            {:else}
                <span>{list.Summary}</span>
            {/if}
        </p>
    {/if}

    {#each tasks as task}
        <Task   {task}
                {getAllTags}
                {onUpdateAllTags}
                {users}/>
    {/each}
</section>
{/if}