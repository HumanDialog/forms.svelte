<script>
    import {tick, onMount, afterUpdate} from 'svelte'
    import {reef} from '@humandialog/auth.svelte'
    import { Dialog, Input, Combo, ComboItem, i18n, ext, clearActiveItem, Ricon, Editable} from '$lib'
    // tmp
    import {FaChevronLeft, FaChevronRight, FaColumns} from 'svelte-icons/fa'


    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined

    let editColumnDialog;

    let editingColumnProps = {
        name: '',
        state: 0,
        stateStr: '0.000'
    }

    let processStates = []
    let newColumnPos = 0
    let editingColumnPos = 0
    const ADD_COLUMN = 1
    const EDIT_COLUMN = 2
    let columnEditorMode = 0 
    let editingColumnMessage = ''
    let taskStates;

    let title = ''
    let ok = 'OK'
    
    let onApplyCb

    export async function addColumn(pos, allColumns, onApply)
    {
        newColumnPos = pos;
        if(!processStates.length)
        {
            processStates = await reef.get(`group/GetPredefinedTaskStates`)
            await tick();
        }

        onApplyCb = onApply
        taskStates = allColumns
        editingColumnProps.name = '_; New column; Nueva columna; Nowa kolumna'
        editingColumnProps.state = 0
        editingColumnProps.stateStr = stateToStr(editingColumnProps.state)

        columnEditorMode = ADD_COLUMN

        title = '_; Add column; Añadir columna; Dodaj kolumnę'
        ok = '_; Add; Añadir; Dodaj'
        editingColumnMessage = ''
        editColumnDialog.show();
        
    }

    export async function editColumn(pos, allColumns, onApply)
    {
        editingColumnPos = pos;
        if(!processStates.length)
        {
            processStates = await reef.get(`group/GetPredefinedTaskStates`)
            await tick();
        }

        onApplyCb = onApply
        taskStates = allColumns
        const column = taskStates[editingColumnPos]
        editingColumnProps.name = ext(column.name)
        editingColumnProps.state = column.state
        editingColumnProps.stateStr = stateToStr(editingColumnProps.state)
        
        columnEditorMode = EDIT_COLUMN

        title = '_; Column properties; Editar columna; Właściwości kolumny'
        ok = 'OK'
        editingColumnMessage = ''
        editColumnDialog.show();
    }

    export function hide()
    {
        editColumnDialog.hide();
    }

    function stateToStr(state)
    {
        return Number(state / 1000).toFixed(3)
    }


    function cancelColumnEditor()
    {
        editColumnDialog.hide();
    }

    async function onColumnEditorOK()
    {
        switch(columnEditorMode)
        {
        case ADD_COLUMN:
            await onNewProcessColumnRequested()
            break;

        case EDIT_COLUMN:
            await onEditColumnRequested()
            break;
        }
    }

    async function onNewProcessColumnRequested()
    {
        let newState
        if (typeof editingColumnProps.stateStr === 'string' || editingColumnProps.stateStr instanceof String)
        {
            const stateFloat = parseFloat(editingColumnProps.stateStr)
            if(isNaN(stateFloat))
            {
                editingColumnMessage = '_; State value is in wrong format; El valor del estado tiene un formato incorrecto; Wartość stanu ma nieprawidłowy format'
                return
            }
            else
            {
                newState = Math.floor(stateFloat * 1000)
            }   
        }
        else
            newState = editingColumnProps.state

        editingColumnMessage = ''
        const sameStateColumnIdx = taskStates.findIndex((c) => c.state == newState)
        if(sameStateColumnIdx >= 0)
        {
            editingColumnMessage = '_; Another column has the same state; Otra columna tiene el mismo estado; Inna kolumna ma ten sam stan'
            return
        }

        editColumnDialog.hide();

        if(onApplyCb)
            await onApplyCb(newColumnPos, newState, editingColumnProps.name)
    }

    async function onEditColumnRequested()
    {
        let newState
        if (typeof editingColumnProps.stateStr === 'string' || editingColumnProps.stateStr instanceof String)
        {
            const stateFloat = parseFloat(editingColumnProps.stateStr)
            if(isNaN(stateFloat))
            {
                editingColumnMessage = '_; State value is in wrong format; El valor del estado tiene un formato incorrecto; Wartość stanu ma nieprawidłowy format'
                return
            }
            else
            {
                newState = Math.floor(stateFloat * 1000)
            }
        }
        else
            newState = editingColumnProps.state

        editingColumnMessage = ''
        const prevState = taskStates[editingColumnPos].state

        if(prevState != newState)
        {
            const sameStateColumnIdx = taskStates.findIndex((c) => c.state == newState)
            if(sameStateColumnIdx >= 0)
            {
                editingColumnMessage = '_; Another column has the same state; Otra columna tiene el mismo estado; Inna kolumna ma ten sam stan'
                return
            }
        }

        const prevName = taskStates[editingColumnPos].name
        const newName = editingColumnProps.name.trim()
        
        editColumnDialog.hide();

        if(onApplyCb)
            await onApplyCb(    editingColumnPos, 
                                newState != prevState ? newState : undefined,
                                newName !=  prevName  ? newName  : undefined)
    }

    let rerenderStateValue = 1
    function onNewColumnStateSelected(state, name)
    {
        editingColumnProps.stateStr = stateToStr(editingColumnProps.state)
        rerenderStateValue = rerenderStateValue + 1
    }

    let rootElement;
    let prevHeight = 0
    let closeButtonPos = ''
    afterUpdate( () =>
    {
        if(rootElement)
        {
            const myRect = rootElement.getBoundingClientRect()
            if(myRect.height != prevHeight)
            {
                prevHeight = myRect.height
                if(onSizeChanged)
                    onSizeChanged();
            }

            //closeButtonPos = `top: calc(${myRect.top}px - 2.25rem); left: calc(${myRect.right}px - 1rem)`
            closeButtonPos = `top: calc(${myRect.top}px - 0.25rem); left: calc(${myRect.right}px - 1.25rem)`
        }
    })

    function clearSelection(e)
    {
        clearActiveItem('handy')
    }

    onMount( () => {
        // clear selection when shown
        clearActiveItem('handy')
    })

</script>

{#key processStates}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!--svelte-ignore a11y-no-noninteractive-elementLink-interactions -->

<Dialog bind:this={editColumnDialog}>


    <div class="
                paper w-full
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                m-0 pt-5 pb-5 px-1 sm:px-8
                sm:rounded
                bg-stone-200 dark:bg-stone-900
                flex flex-col
                "
        bind:this={rootElement} on:click={clearSelection}>
    
    <!-------------------------------------------------------------------->
    <!-- POPUP HEADER ---------------------------------------------------->
    <!-------------------------------------------------------------------->
    <h3 class = "flex-none">
        <div class="w-full flex flex-row justify-between">
            <!--div class="py-1.5  flex flex-row justify-between">
                <button class="mr-4 w-6
                            hover:bg-stone-200 hover:dark:bg-stone-700
                            hover:outline hover:outline-8
                            hover:outline-stone-200 hover:dark:outline-stone-700"
                    ><Ricon icon = 'arrow-up' />
                </button>
                <button class="mr-4 w-6
                            hover:bg-stone-200 hover:dark:bg-stone-700
                            hover:outline hover:outline-8
                            hover:outline-stone-200 hover:dark:outline-stone-700">
                    <Ricon icon = 'check-check' />
                </button>
            </div-->
            <div class="grow ">
                <span class="text-left">{title}</span>
            </div>
            <div class="py-1.5  flex flex-row justify-between">
                <button class="ml-4 w-6
                            hover:bg-stone-200 hover:dark:bg-stone-700
                            hover:outline hover:outline-8
                            hover:outline-stone-200 hover:dark:outline-stone-700"
                            on:click={ cancelColumnEditor }>
                    <Ricon icon = 'x' />
                </button>
            </div>
        </div>
    </h3>

    <!-------------------------------------------------------------------->
    <!-- POPUP CONTENT---------------------------------------------------->
    <!-------------------------------------------------------------------->
    <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
        <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Name; Nombre; Nazwa</h4>
            <p> <Editable self={editingColumnProps} a='name' local /></p>
        </div>

        <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; State; Estado; Stan</h4>
            <Combo  typo compact inContext=''
                    self={editingColumnProps}
                    a='state'
                    changed={onNewColumnStateSelected}>

                {#each processStates as column}
                    <ComboItem key={column.state} name={ext(column.name)}/>
                {/each}
            </Combo>
        </div>

        <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; State value; Valor del estado; Wartość stanu</h4>
            {#key rerenderStateValue}
                <p><Editable self={editingColumnProps} a='stateStr' local/></p>
            {/key}
        </div>
    </div>


    <p class="mt-1 text-sm text-right text-red-700 dark:text-red-300">
        {#if editingColumnMessage}
            {editingColumnMessage}
        {:else}
            {"\u200B"}
        {/if}
    </p>

    <!-------------------------------------------------------------------->
    <!-- POPUP FOOTER----------------------------------------------------->
    <!-------------------------------------------------------------------->
    <h4 class = "flex-none">

        <div class="flex flex-row justify-end gap-2">

            <button class="px-4 mx-2
                    bg-stone-100 dark:bg-stone-800
                    outline outline-offset-2 outline-2
                    outline-stone-200 dark:outline-stone-500
                    hover:bg-stone-200 hover:dark:bg-stone-700
                    "
                    on:click={ cancelColumnEditor }> _; Cancel; Pegar; Anuluj
            </button>

            <button class="px-4 mx-2
                        bg-stone-100 dark:bg-stone-700
                        outline outline-offset-2 outline-2
                        outline-stone-200 dark:outline-stone-500
                        hover:bg-stone-200 hover:dark:bg-stone-700"
                    on:click={ onColumnEditorOK }> {ok}
            </button>
        </div>
    </h4>

    </div>

</Dialog>
{/key}