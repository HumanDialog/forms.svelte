<script>
    import {reef} from '@humandialog/auth.svelte'
    import {  
            editable, selectable, getNiceStringDateTime, startEditing, i18n,
            contextItemsStore,
			activateItem,
			isActive,
			isSelected,
			getActive,
            informModification, onErrorShowAlert,
            pushChanges, setSelectionAtEnd, showFloatingToolbar
        } from '$lib';
    import {link} from 'svelte-spa-router'
    import {FaPen, FaUpload} from 'svelte-icons/fa'
    import NoteProperties from './properties.note.svelte'
    import {tick} from 'svelte'
    import PopupExplorer from './popup.explorer.svelte'

    export let note;

    let placeholder = ''
    let titleElement
    let summaryElement
    let notePropertiesDialog
    
    $: isCardActive = calculate_active(note, $contextItemsStore)
    $: isCardSelected = selected(note, $contextItemsStore)

    $: selectedClass = isCardSelected ? "!border-blue-300 dark:!border-blue-300/50" : "";
    $: focusedClass = isCardActive ? "bg-stone-100 dark:bg-stone-700" : "";

    function calculate_active(...args)
    {
        return isActive('props', note)
    }

    function selected(...args)
    {
        return isSelected(note)
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
                                        action: (f) => copyNoteToBasket()
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

        if(isActive('props', note))
        {
            return;
        }

        activateItem('props', note, operations);
    }

    function onTitleChanged(text)
    {
        note.Title = text;
        informModification(note, 'Title');
        pushChanges();
    }

    function onSummaryChanged(text)
    {
        note.Summary = text;
        informModification(note, 'Summary');
        pushChanges();
    }

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
                if(summaryElement)
                    summaryElement.focus();
            }
        }
       
    }

    async function copyNoteToBasket()
    {
        await reef.post(`${note.$ref}/CopyToBasket`, {flags: 0}, onErrorShowAlert)
    }

    async function runPopupExplorerToPlaceElement(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            canSelectRootElements: true,
            onAttach: async (tmp, references) => {
                await reef.post(`${note.$ref}/AttachMeTo`, { references: references }, onErrorShowAlert)
            }
        })
    }

    function runElementProperties(btt, aroundRect)
    {
        notePropertiesDialog.show(note)    
    }


</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-interactions -->
<section    class="relative left-[-0.25rem] pl-1 rounded-md border border-transparent {selectedClass} {focusedClass}"
            use:selectable={note}
            on:click={activate}>
    <!--p class="text-sm">{getNiceStringDateTime(note.ModificationDate)}</p-->
    <h4>
        {#if isCardActive}
            <a href={note.href} use:link
                use:editable={{
                    action: (text) => onTitleChanged(text), 
                    active: false,
                    onFinish: (d) => {titleElement.blur()}
                    }}
                bind:this={titleElement}>
                {note.Title}
            </a>    
        {:else}
            <span>{note.Title}</span>
        {/if}
    </h4>
    

    {#if note.Summary || placeholder == 'Summary'}
        <p>
            {#if isCardActive}
                <span use:editable={{
                                action: (text) => onSummaryChanged(text), 
                                active: true,
                                onFinish: (d) => {placeholder = ''}}}
                            bind:this={summaryElement}>
                    {note.Summary}</span>
            {:else}
                <span>{note.Summary}</span>
            {/if}
        </p>
    {/if}
</section>

<NoteProperties bind:this={notePropertiesDialog} />