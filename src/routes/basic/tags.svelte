<script lang="ts">
    import {tick} from 'svelte'
    import Tag from './tag.svelte' 
    import FaPlus from 'svelte-icons/fa/FaPlus.svelte'
	import {Combo, ComboItem} from '$lib';

    export let tags: string = ''
    export let globalTags :string = ''

    export let onSelect: any|undefined = undefined
    export let onCreate: any|undefined = undefined
    export let onRemove: any|undefined = undefined
    export let isCompact: boolean = true;

    export let s: string = 'sm'

    let userClass = $$props.class ?? '';

    let tagsTable = []
    let globalTagsTable = []

    $:{
        globalTagsTable = decomposeTags(globalTags)
        tagsTable = decomposeTags(tags, globalTagsTable)
    }

    let addComboVisible: boolean = false;
    let addCombo;
    export async function show(event, hideCallback)
    {
        if(event)
        {
            event.stopPropagation();
            event.preventDefault();
        }

        addComboVisible = true
        await tick();

        const onAfterCloseCombo = () => {
            addComboVisible = false;
            
            if(hideCallback)
                hideCallback()
        }
        
        addCombo?.show(undefined, onAfterCloseCombo);
    } 

    function onSelectedTagFromList(itm :object, key :string, name :string)
    {
        onSelect(key);
    }

    function onNewTagCreated(key :string, name :string)
    {
        onCreate(key)
    }

    function decomposeTags(tags: string, referenceTable=undefined)
    {
        let table = [];

        if(!tags)
            return table;

        let names = tags.split('#');

        for(let i=0; i<names.length; i++)
        {
            let name = names[i].trim();
            if(!name)
                continue;

            let components = name.split(':');
            let label = components[0];
            if(!label)
                continue;

            let color :string;
            if(components.length > 1)
                color = components[1];
            
            if(!color)
            {
                if(referenceTable && Array.isArray(referenceTable))
                {
                    const referenceItem = referenceTable.find(e => e.label == label)
                    color = referenceItem.color
                }
                
                if(!color)
                    color = "DarkGray"   // todo generate from string hash
            }
            
            table.push( {
                label: label,
                color: color
            })
        }

        return table;
    }

    function getNotUsedTags()
    {
        let result = globalTagsTable.filter(e => {
            const label = e.label;
            let idx = tagsTable.findIndex(f => f.label == label)
            if(idx < 0)
                return true;
            else
                return false;
        });

        return result;
    }

    let gap = 'gap-2';
    switch(s)
    {
    case 'md':
        gap = 'gap-2'
        break;

    case 'sm':
        gap = 'gap-2'
        break;

    case 'xs':
        gap = 'gap-1'
        break;
    }

</script>

<div class="{userClass} flex flex-row {gap} flex-wrap mr-1 sm:mr-0">
    {#each tagsTable as tag}
        {#if onRemove}
            <Tag name={tag.label} color={tag.color} {s}
                 onremove={(e) => {onRemove(tag.label)}}/>
        {:else}
            <Tag name={tag.label} color={tag.color} {s}/>
        {/if}
    {/each}

    {#if onSelect}
        {#if !addComboVisible}
            {#if !isCompact}
                <button    class="mt-1 pl-0 pr-1 rounded text-stone-500 flex flex-row border-stone-500 border hover:cursor-pointer"
                        on:click={(e) => { show(e, undefined)} }>
                    <div class="ml-1 mt-1 w-3 h-3"><FaPlus/></div>
                </button>
            {/if}
        {:else}
            <Combo  compact={true} 
                    in_context='data'
                    on_select={onSelectedTagFromList}
                    on_new_item_created={onNewTagCreated}
                    s={s}
                    filtered
                    bind:this={addCombo}>
                {@const not_used_tags = getNotUsedTags()}
                {#each not_used_tags as tag}
                    <ComboItem key={tag.label}/>
                {/each}
            </Combo>
        {/if}
    {/if}
</div>