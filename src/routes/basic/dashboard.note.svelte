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
            pushChanges, setSelectionAtEnd, showFloatingToolbar,

			Editable,
            openInNewTab, copyAddress,
			focusEditable


        } from '$lib';
    import {link} from 'svelte-spa-router'
    import {FaPen, FaUpload} from 'svelte-icons/fa'
    import NoteProperties from './properties.note.svelte'
    import {tick} from 'svelte'
    import PopupExplorer from './popup.explorer.svelte'

    export let note;

    let placeholder = ''
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
                            mricon: 'pencil',
                            mricon: 'pencil',
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
                            mricon: 'upload',
                            tbr: 'C',
                            fab: 'S00',
                            menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyNoteToBasket()
                                    },
                                    {
                                        caption: '_; Copy to folder; Copiar a la carpeta; Kopiuj do folderu',
                                        action: (btt, rect) => runPopupExplorer4CopyToFolder(btt, rect)
                                    },
                                    { separator: true},
                                    {
                                        caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                                        action: () => openInNewTab(note.href)
                                    },
                                    {
                                        caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                                        action: () => copyAddress(note.href)
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


    export async function editProperty(field)
    {
        if(field == "Title")
        {
            focusEditable('Title')
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

    async function copyNoteToBasket()
    {
        await reef.post(`${note.$ref}/CopyToBasket`, {flags: 0}, onErrorShowAlert)
    }

    async function runPopupExplorer4CopyToFolder(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            attachToContainer: true,
            rootFilter: 'FOLDERS',
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
    <figure class="cursor-pointer"
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

    <figure class="bg-stone-200 dark:bg-stone-700
                outline outline-8
                outline-stone-200 dark:outline-stone-700
                ring-1 ring-offset-8
                ring-stone-300 dark:ring-stone-700"
            use:selectable={note}
            on:click={activate}>
        <a href={note.href} use:link>
        <h4>
            <Editable self={note} a='Title' focusOnClick={false}/>
        </h4>
        </a>

    {#if note.Summary || placeholder=='Summary'}
        <figcaption>
            <Editable self={note} a='Summary'/>
        </figcaption>
    {/if}
    </figure>
{/if}

<!--NoteProperties bind:this={notePropertiesDialog} /-->