<script lang="ts">
    import {tick, getContext} from 'svelte'
    import Tag from './tag.svelte' 
    import FaPlus from 'svelte-icons/fa/FaPlus.svelte'
	import Combo from './combo/combo.svelte'
    import ComboItem from './combo/combo.item.svelte'
    import {contextItemsStore, data_tick_store, contextTypesStore} from '../stores.js'
    import {informModification, pushChanges} from '../updates.js'

    export let tags: string = ''
    export let globalTags :string = ''

    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';

    export let onSelect: any|undefined = undefined
    export let onCreate: any|undefined = undefined
    //export let onRemove: any|undefined = undefined
   
    export let compact :boolean = true;
    export let inContext :string = ''   // in compact mode
    export let pushChangesImmediately: boolean = true;

    export let changed = undefined;
    export let s: string = 'sm'

    let userClass = $$props.class ?? '';

    let   item = null
    let ctx = context ? context : getContext('ctx');

    let tagsTable = []
    let globalTagsTable = []
    let isEditable: boolean = true;

    $: setup($data_tick_store, $contextItemsStore);

    function setup(...args)
    {
        globalTagsTable = decomposeTags(globalTags)

        if(!tags)
        {
            item = self ?? $contextItemsStore[ctx];
                
            if(!typename)
                typename = $contextTypesStore[ctx];

            if(!typename)
            {
                if(item.$type)
                    typename = item.$type;
                else if(item.$ref)
                {
                    let s = item.$ref.split('/')
                    typename = s[1];
                }
            }
            
            if(!item[a])
                tags = '';
            else
                tags = item[a];
        }

        tagsTable = decomposeTags(tags, globalTagsTable)

        if(compact)
        {
            isEditable = false;

            if(!inContext)
                isEditable = true;
            else
            {
                let contexts = inContext.split(' ');
                contexts.forEach(ctx => 
                {   
                    const selectedItem = $contextItemsStore[ctx];
                    if(selectedItem && selectedItem.Id == item.Id)
                        isEditable = true;
                } )
            }
        }
        else
            isEditable =  true;
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

    function applyChange()
    {
        if(onSelect)
            onSelect(tags)
        else if(item != null)
        {
            item[a] = tags;
            
            if(typename)
                informModification(item, a, typename);
            else
                informModification(item, a);

            //$data_tick_store = $data_tick_store + 1;
            if(pushChangesImmediately)
                pushChanges();
        }

        if(!!changed)
            changed(value);
    }

    function onSelectTag(itm: object, key: string, name: string)
    {
        tags += `#${key} `
        tagsTable = decomposeTags(tags, globalTagsTable)

        applyChange();
    }

    function onRemoveTag(tag: string)
    {
        tags = tags.replace(`#${tag}`, '')
        tagsTable = decomposeTags(tags, globalTagsTable)

        applyChange();
    }

    function onNewTagCreated(key :string, name :string)
    {
        tags += `#${key} `
        globalTags += `#${key} `
        
        globalTagsTable = decomposeTags(globalTags)
        tagsTable = decomposeTags(tags, globalTagsTable)

        applyChange();

        onCreate(globalTags)
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
                    if(referenceItem)
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
        gap = 'gap-3 sm:gap-2'
        break;

    case 'sm':
        gap = 'gap-2 sm:gap-2'
        break;

    case 'xs':
        gap = 'gap-2 sm:gap-1'
        break;
    }

</script>

<div class="{userClass} flex flex-row {gap} flex-wrap mr-1 sm:mr-0">
    {#each tagsTable as tag}
        {#if isEditable}
            <Tag name={tag.label} color={tag.color} {s}
                 onRemove={(e) => {onRemoveTag(tag.label)}}/>
        {:else}
            <Tag name={tag.label} color={tag.color} {s}/>
        {/if}
    {/each}

    {#if isEditable}
        {#if !addComboVisible}
            {#if !compact}
                <button    class="mt-1 pl-0 pr-1 rounded text-stone-500 flex flex-row border-stone-500 border hover:cursor-pointer"
                        on:click={(e) => { show(e, undefined)} }>
                    <div class="ml-1 mt-1 w-3 h-3"><FaPlus/></div>
                </button>
            {/if}
        {:else}
            <Combo  compact={true} 
                    inContext='data'
                    onSelect={onSelectTag}
                    onNewItemCreated={onNewTagCreated}
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