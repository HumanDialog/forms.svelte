<script>
     import {reef} from '@humandialog/auth.svelte'
     import {  
            editable, selectable, getNiceStringDateTime, startEditing, i18n,
            contextItemsStore, showFloatingToolbar,
			activateItem,
			isActive,
			isSelected,
			DatePicker,
            Combo, Tags, ComboSource,
            informModification, pushChanges, onErrorShowAlert, setSelectionAtEnd
        } from '$lib';
    import PopupExplorer from './popup.explorer.svelte'
    import TaskProperties from './properties.task.svelte'
    import {link} from 'svelte-spa-router'
    import {tick} from 'svelte'
    import {FaPen, FaUpload} from 'svelte-icons/fa'
	import { Span } from 'flowbite-svelte';

    export let task;
    export let getAllTags = undefined
    export let onUpdateAllTags = undefined
    export let users = []

    const STATE_FINISHED = 7000

    let placeholder = ''

    $: isCardActive = calculate_active(task, $contextItemsStore)
    $: isCardSelected = selected(task, $contextItemsStore)

    $: selectedClass = isCardSelected ? "!border-blue-300 dark:!border-blue-300/50" : "";
    $: focusedClass = isCardActive ? "bg-stone-100 dark:bg-stone-700" : "";

    function calculate_active(...args)
    {
        return isActive('props', task)
    }

    function selected(...args)
    {
        return isSelected(task)
    }


    let operations = {
        opver: 2,
        fab: 'M00',
        tbr: 'D',
        operations: [
            {
                caption: '_; View; Ver; Widok',
                operations:[
                ]
            },
            {
                caption: '_; Task; Tarea; Zadanie',
                operations: [
                    {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            tbr: 'A',
                            fab: 'M20',
                            grid: [
                                {
                                    caption: '_; Title; Título; Tytuł',
                                    columns: 2,
                                    action: (f) =>  { editProperty('Title') }
                                },
                                {
                                    caption: '_; Summary; Resumen; Podsumowanie',
                                    action: (f) =>  { editProperty('Summary') }
                                },
                                {
                                    separator: true
                                },
                                {
                                    caption: '_; Responsible; Responsable; Odpowiedzialny',
                                    action: (f) => { editProperty('Actor') }
                                },
                                {
                                    caption: '_; Due Date; Fecha; Termin',
                                    action: (f) => { editProperty('DueDate') }
                                },
                                {
                                    caption: '_; Tag; Etiqueta; Etykieta',
                                    action: (f) => { editProperty('Tags') }
                                }
                            ]
                        },
                        {
                            caption: '_; Send; Enviar; Wyślij',
                            icon: FaUpload, 
                            tbr: 'D',
                            fab: 'S00',
                            menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyTaskToBasket()
                                    },
                                    {
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect)
                                    }
                                ], 
                            hideToolbarCaption: true
                        },
                    /*  don't know if it does make sense  
                        {
                            caption: '_; Archive; Archivar; Zarchiwizuj',
                            //icon: FaArchive,
                            action: (f) => askToArchive(task)
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            //icon: FaTrash,
                            action: (f) => askToDelete(task)
                        },
                    */  {
                            caption: '_; Properties; Propiedades; Właściwości',
                            action: (btt, rect)=> runElementProperties(btt, rect)
                        }
                ]
            }
        ]
    }

    export function activate(e)
    {
        if(e)
            e.stopPropagation();

        if(isActive('props', task))
        {
            return;
        }

        activateItem('props', task, operations);
    }


    let titleElement;
    let summaryElement;
    let dueDateElement;
    let actorElement;
    let tagsElement;
    export async function editProperty(field)
    {
        if(field == "Title")
        {
            startEditing(titleElement);
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
                if(!!summaryElement)
                    summaryElement.focus();
            }
        }
        else if(field == 'DueDate')
        {
            if(dueDateElement)
                dueDateElement.show();
            else
            {
                placeholder = field;
                await tick();
                if(dueDateElement)
                    dueDateElement.show(undefined, () => {placeholder = ''});
            }
            }
        else if(field == 'Actor')
        {
            if(actorElement)
                actorElement.show();
            else
            {
                placeholder = field;
                await tick();
                if(actorElement)
                    actorElement.show(undefined, () => {placeholder = ''});
            }
        }
        else if(field == 'Tags')
        {
            if(tagsElement)
                tagsElement.show();
            else
            {
                placeholder = field;
                await tick();
                if(tagsElement)
                    tagsElement.show(undefined, () => {placeholder = ''});
            }
        }
    }

    
    
    function onTitleChanged(text)
    {
        task.Title = text;
        informModification(task, 'Title');
        pushChanges();
    }

    function onSummaryChanged(text)
    {
        task.Summary = text;
        informModification(task, 'Summary');
        pushChanges();
    }

    async function copyTaskToBasket()
    {
        await reef.post(`${task.$ref}/CopyToBasket`, {flags: 0}, onErrorShowAlert)
    }

    async function runPopupExplorerToPlaceElement(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            canSelectRootElements: true,
            onAttach: async (tmp, references) => {
                await reef.post(`${task.$ref}/AttachMeTo`, { references: references }, onErrorShowAlert)
            }
        })
    }

    let taskPropertiesDialog;
    function runElementProperties(btt, aroundRect)
    {
        taskPropertiesDialog.show(task)    
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-interactions -->
<section    class=" relative left-[-0.75rem] rounded-md border border-transparent {selectedClass} {focusedClass}
                    not-prose mx-2 pt-2 pb-4 px-1 "
            use:selectable={task}
            on:click={activate}>

    <!-- TOP PROPERTIES: Index, DueDate -->
    <section class="flex flex-row justify-between">
        {#if task.Index}
            <p
                class="     h-6
                            text-sm sm:min-h-[1rem]
                            text-base-sm min-h-[1.5rem]
                            text-stone-600 dark:text-stone-400
                            text-right">
                {task.Index}
            </p>
        {/if}

        {#if task.DueDate || placeholder=='DueDate'}
            <DatePicker
                        self={task}
                        a={'DueDate'}
                        compact={true}
                        s="sm"
                        inContext="props"
                        bind:this={dueDateElement}/>
        {/if}
    </section>

    <h4 class=" text-base font-semibold
                sm:text-base sm:font-semibold">
        {#if isCardActive}
            <a  href={task.href} 
                use:link 
                class="cursor-pointer underline"
                use:editable={{
                    action: (text) => onTitleChanged(text), 
                    active: false,
                    onFinish: (d) => {titleElement.blur()},
                    onSoftEnter: async (text) => { onTitleChanged(text); await editProperty('Summary') }
                    }}
                bind:this={titleElement}>
                {task.Title}
            </a>
        {:else}
            <span>{task.Title}</span>
        {/if}
    </h4>

    <!-- MIDDLE PROPERTIES: Actor -->
    {#if task.Actor || placeholder=='Actor'}
        <section class="flex flex-row justify-between">
            <Combo  compact={true}
                    inContext="props"
                    self={task}
                    a='Actor'                   
                    isAssociation
                    hasNone
                    icon={false}
                    s="sm"
                    bind:this={actorElement}> <!-- changed={(k,n) => { /*fake assignment for component rer-ender*/ item[prop.a] = item[prop.a]; }}  -->
                <ComboSource objects={users} key="$ref" name='Name'/>
            </Combo>
        </section>
    {/if}
    
    {#if task.Summary || placeholder=='Summary'}
        <p class="  text-sm sm:text-sm 
                    text-stone-600 dark:text-stone-400">
        {#if isCardActive}
            <span use:editable={{
                                action: (text) => onSummaryChanged(text), 
                                active: true,
                                onFinish: (d) => {placeholder = ''}}}
                            bind:this={summaryElement}>
                {task.Summary}
            </span>
        {:else}
            <span>
                {task.Summary}
            </span>
        {/if}
        </p>
    {/if}

    <!-- BOTTOM PROPERTIES: Tags -->
    {#if task.Tags || placeholder=='Tags'}
        <Tags
                class="mt-1"
                compact
                inContext="props"
                self={task}
                a='Tags'
                getGlobalTags={getAllTags}
                onUpdateAllTags={onUpdateAllTags}
                s="sm"
                canChangeColor={true}
                bind:this={tagsElement}/>
    {/if}
</section>

<TaskProperties bind:this={taskPropertiesDialog} />