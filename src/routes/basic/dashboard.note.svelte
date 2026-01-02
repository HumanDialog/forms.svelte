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

    let full_view = true
    let demo_view = false

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
            },
            ownCloseButton: true
        })
    }

    function runElementProperties(btt, aroundRect)
    {
        notePropertiesDialog.show(note)
    }


</script>
<!-- svelte-ignore a11y-click-events-have-key-events ----->
<!-- svelte-ignore a11y-no-noninteractive-interactions --->
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
    <figure class="relative rounded-md border border-transparent"
            use:selectable={note}
            on:click={activate}>

        <h4>
            {note.Title}
        </h4>


    {#if note.Summary}
        <figcaption>
                {note.Summary}
        </figcaption>
    {/if}
    </figure>





<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
{:else }
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!---- ACTIVE WITH CONROLS  ----------------------------------------------------------------------->
<!------- keep pure layout  ----------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->

    <figure class="relative bg-stone-700 rounded outline outline-8 outline-stone-700 ring-1 ring-stone-700 ring-offset-8"
            use:selectable={note}
            on:click={activate}>
        <a href={note.href} use:link>
        <h4     use:editable={{
                action: (text) => onTitleChanged(text),
                active: false,
                onFinish: (d) => {titleElement.blur()}
                }}
            bind:this={titleElement}>
            {note.Title}

        </h4>
        </a>

    {#if note.Summary}
        <figcaption>
                <span use:editable={{
                                action: (text) => onSummaryChanged(text),
                                active: true,
                                onFinish: (d) => {placeholder = ''}}}
                            bind:this={summaryElement}>
                    {note.Summary}</span>
        </figcaption>
    {:else if placeholder == 'Summary'}
        <figcaption>
                <span use:editable={{
                                action: (text) => onSummaryChanged(text),
                                active: true,
                                onFinish: (d) => {placeholder = ''}}}
                            bind:this={summaryElement}>
                    i</span>

        </figcaption>

    {/if}
    </figure>
{/if}

<!--NoteProperties bind:this={notePropertiesDialog} /-->