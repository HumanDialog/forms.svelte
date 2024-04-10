<script lang="ts">
    import {setContext, getContext, afterUpdate} from 'svelte'
    import {rKanban_definition} from './Kanban'
    import {parseWidthDirective, clearActiveItem} from '../../utils' 
    import {data_tick_store, contextItemsStore, contextTypesStore } from '../../stores'
    import Column from './internal/kanban.column.svelte'
    

    export let title:               string = ''
    export let self:                object|undefined = undefined;

    export let context  :string = ""
    export let typename :string = '';
    export let c = '';

    export let key: string = '';

    let user_class = $$props.class ?? ''

    
    let definition :rKanban_definition = new rKanban_definition;
    setContext('rKanban-definition', definition);
    setContext('rIs-table-component', true);

    let     item  :object | null = null
    let     ctx   :string = context ? context : getContext('ctx');

    let     cs =  c ? parseWidthDirective(c) : 'w-full min-w-full';

    clearActiveItem('props')

    let  last_tick = -1   
    $: setup($data_tick_store, $contextItemsStore);

    function setup(...args)
    {
        last_tick = $data_tick_store   
        if(self && ctx)         
            $contextItemsStore[ctx] = self;
        
        if(!typename)
            typename = $contextTypesStore[ctx];
    }

    export function refresh()
    {
        setup();
    }

    export function updateSelf(_self :object)
    {
        self = _self;
        setup();
    }

    export function getColumnIdx(item)
    {
        for(let idx=0; idx < columns.length; idx++)
        {
            let card = columns[idx].findCardByItem(item)
            if(card)
                return idx;
        }

        return -1;
    }

    let columns = []

    afterUpdate( () =>
    {
        for(let i=1; i<columns.length; i++)
        {
            let left_column = columns[i-1];
            let right_column = columns[i];
            const left_column_height = left_column.getHeight()
            const right_column_height = right_column.getHeight()
            if(left_column_height > right_column_height)
            {
                left_column.setBorder(left_column.SET_RIGHT)
                right_column.setBorder(right_column.CLEAR_LEFT)
            }
            else
            {
                left_column.setBorder(left_column.CLEAR_RIGHT)
                right_column.setBorder(right_column.SET_LEFT)
            }

        }
    })

    export function showMoveOperationsForItem(item)
    {
        columns.forEach( c => {
            const card = c.findCardByItem(item)
            if(card)
                card.showMoveOperations()
        })
    }

    export function scrollViewToCard(item)
    {
        columns.forEach( c => {
            const card = c.findCardByItem(item)
            if(card)
                card._scrollViewToCard()
        })
    }

</script>

<slot/> <!-- Launch definition settings -->


<section class="h-full mt-5 flex flex-row no-wrap  sm:justify-center  overflow-x-auto {user_class}">
    {#each definition.columns as column, idx (column.id)}
        <Column title={column.title}
                width={column.width}
                self={column.self}
                a={column.a}
                objects={column.objects}
                context={column.context}
                key={key}
                currentColumnIdx={idx}
                {showMoveOperationsForItem}
                {scrollViewToCard}
                bind:this={columns[idx]}>

            
            <svelte:fragment slot="kanbanCardTopProps" let:element>
                <slot name="kanbanCardTopProps" {element}/>
            </svelte:fragment>
        
            <svelte:fragment slot="kanbanCardMiddleProps" let:element>
                <slot name="kanbanCardMiddleProps" {element}/>
            </svelte:fragment>
        
            <svelte:fragment slot="kanbanCardBottomProps" let:element>
                <slot name="kanbanCardBottomProps" {element}/>
            </svelte:fragment>
            
        </Column>
    {/each}
</section>

<style>
    .grid-1
    {
        display: grid;
        grid-template-columns: 100%;
    }

    .grid-2
    {
        display: grid;
        grid-template-columns: 50% 50%;
    }

    .grid-3
    {
        display: grid;
        grid-template-columns: 33% 33% 33%;
    }

    .grid-4
    {
        display: grid;
        grid-template-columns: 25% 25% 25% 25%;
    }
    .grid-5
    {
        display: grid;
        grid-template-columns: 20% 20% 20% 20% 20%;
    }
    .grid-6
    {
        display: grid;
        grid-template-columns: 16.6% 16.6% 16.6% 16.6% 16.6% 16.6;
    }
    .grid-7
    {
        display: grid;
        grid-template-columns: 14.3% 14.3% 14.3% 14.3% 14.3% 14.3% 14.3%;
    }
    .grid-8
    {
        display: grid;
        grid-template-columns: 12.5% 12.5% 12.5% 12.5% 12.5% 12.5% 12.5% 12.5%;
    }

</style>
