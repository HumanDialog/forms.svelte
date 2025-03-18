<script lang="ts">
    import Icon from '../icon.svelte'
    import Edit from '../edit.field.svelte'
    import {FaPlus} from 'svelte-icons/fa'
	import { getPrev, getNext, swapElements, getLast, getFirst, remove, insertAt } from '$lib/utils';
	import { informModification, pushChanges } from '$lib/updates';
	import { tick } from 'svelte';

    export let objects: object[];
    export let orderAttrib: string | undefined = undefined;
    
    export let inserter: Function | undefined = undefined;
    export let inserterPlaceholder = 'New'

    export const ORDER_STEP = 64;
    export const MIN_ORDER = 0;

    let temporaryInserter: boolean = false;

    export function reload(_objects: object[])
    {
        objects = _objects;
    }

    export function moveUp(element: object)
    {
        if(!orderAttrib)
            return;

        let prev = getPrev(objects, element)
        if(prev)
        {
            objects = swapElements(objects, element, prev)
            
            const tmp = element[orderAttrib]
            element[orderAttrib] = prev[orderAttrib]
            prev[orderAttrib] = tmp;

            informModification(element, orderAttrib)
            informModification(prev, orderAttrib)
            pushChanges();
        }
    }

    export function moveTop(element: object)
    {
        if(!orderAttrib)
            return;

        let current = getFirst(objects);

        if(current == element)
            return;

        const firstOrder = current[orderAttrib];

        while(current != element)
        {
            const next = getNext(objects, current);
            const nextOrder = next[orderAttrib];
            
            current[orderAttrib] = nextOrder;
            informModification(current, orderAttrib);

            current = next;
        }
        
        element[orderAttrib] = firstOrder
        informModification(element, orderAttrib);

        objects = remove(objects, element);
        objects = insertAt(objects, 0, element);

        pushChanges();
        
    }

    export function moveDown(element: object)
    {
        if(!orderAttrib)
            return;

        let next = getNext(objects, element)
        if(next)
        {
            objects = swapElements(objects, element, next);

            const tmp = element[orderAttrib]
            element[orderAttrib] = next[orderAttrib]
            next[orderAttrib] = tmp;

            informModification(element, orderAttrib)
            informModification(next, orderAttrib)
            pushChanges();
        }
    }

    let inserterElement;
    export async function add(onAddHandler: Function)
    {
        temporaryInserter = true;
        inserter = onAddHandler
        await tick();
        inserterElement?.run();
    }

    function onNewElement(text: string)
    {
        if(orderAttrib)
        {
            let newElementOrder;

            const last = getLast(objects);
            if(last)
                newElementOrder = last[orderAttrib] + ORDER_STEP;
            else
                newElementOrder = MIN_ORDER;
            
            inserter(text, newElementOrder)
        }
        else
            inserter(text)

        if(temporaryInserter)
        {
            temporaryInserter = false;
            inserter = undefined;
        }
    }

    function onBlurInserter()
    {
        if(temporaryInserter)
        {
            temporaryInserter = false;
            inserter = undefined;
        }
    }

</script>

{#each objects as item, idx (item.Id)}
    {#key item}             <!-- Forces to fully rerender when item changed to fire use: callbacks again -->
        <slot {item} {idx}/>
    {/key}
{/each }

{#if inserter}
    <Edit   class=" mb-2 ml-2
            text-base font-normal 
            text-stone-500 rounded-lg dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700" 
            onEnter={onNewElement} 
            placeholder={inserterPlaceholder} 
            inserter={true}
            onBlur={onBlurInserter}
            bind:this={inserterElement}>
        <Icon component={FaPlus} class="w-5 h-5 mt-0.5 ml-2.5 pr-0.5 mr-4"/>
    </Edit>
{/if}