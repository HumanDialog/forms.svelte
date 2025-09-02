<script>
    import Tag from './tag.svelte'
    import {FaPlus} from 'svelte-icons/fa'
    import TagColorsPalette from './tag.colors.svelte'
	import { tick } from 'svelte';
	import { isDeviceSmallerThan } from '$lib/utils';
    import {i18n} from '../i18n'

    export let usedTags = []
    export let allTags  = []
    
    export let onSelect;
    export let onNewTag = undefined;

    export let onHide = undefined
    export let onSizeChanged = undefined

    let allowNewTags = onNewTag != undefined;

    let userClass = $$props.class ?? '';

    const TAGS_PALETTE = 0
    const COLORS_PALETTE = 1
    let view = TAGS_PALETTE;

    $: notUsedTags = getNotUsedTags() 
    $: filteredTags = filterTags(notUsedTags, '')

    export function reload(props)
    {
        if(props && props.usedTags)
            usedTags = props.usedTags

        if(props && props.allTags)
            allTags = props.allTags

        if(props && props.onSelect)
            onSelect = props.onSelect

        if(props && props.onNewTag)
            onNewTag = props.onNewTag

        allowNewTags = onNewTag != undefined;

        view = TAGS_PALETTE;
        inputText = ''
        
        notUsedTags = getNotUsedTags() 
        filteredTags = filterTags(notUsedTags, '')
    }

    let gap = 'gap-2';
    let s = "md"
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

    function getNotUsedTags()
    {
        let result = allTags.filter(e => {
            const label = e.label;
            let idx = usedTags.findIndex(f => f.label == label)
            if(idx < 0)
                return true;
            else
                return false;
        });

        return result;
    }

    function onTagSelected(tag)
    {
        if(onSelect)
            onSelect(tag, tag.label, tag.label)
    }

    let inputText = '';
    function onTextInput(e)
    {
        filteredTags = filterTags(notUsedTags, inputText)

        // don't know if needed. we'll see
        //await tick();
        //if(onSizeChanged)
        //    onSizeChanged();
    }

    function filterTags(tags, inputText)
    {
        if(!inputText)
            return [...tags];
        else
        {
            const filterText = inputText.toLowerCase()
            return tags.filter(e => e.label && e.label.toLowerCase().includes( filterText ))
        }
    }

    function onKeyDown(e)
    {
        switch(e.key)
        {
        case 'Enter':
            if(filteredTags.length > 0)
            {
                inputText = ''
                onTagSelected(filteredTags[0])
                if(onHide)
                    onHide()
            }
            else if(allowNewTags)
            {
                onAddTag(undefined)
            }
            break;

        case 'Escape':
            if(inputText)
            {
                inputText = ''
                filteredTags = filterTags(notUsedTags, inputText)
            }
            else
            {
                if(onHide)
                    onHide()
            }
            break;
        
        }
    }

    

    function onTextBlur(e)
    {
        if(isDeviceSmallerThan("sm"))   // blur when virtual keyboard is visible means 'OK' button pressed
        {
            if((filteredTags.length == 0) && allowNewTags)
            {
                onAddTag(undefined)
            }
        }
        else
        {

        }
    }

    async function onAddTag(e)
    {
        if(inputText && onNewTag)
        {
            view = COLORS_PALETTE
            await tick();
            if(onSizeChanged)
                onSizeChanged();
        }
        else if(onHide)
            onHide();
    }

    function onNewTagColorSelected(color)
    {
        if(inputText && onNewTag)
            onNewTag(inputText, inputText, color)
        
        inputText = ''

        if(onHide)
            onHide();
    }

</script>

{#if view==TAGS_PALETTE}
<menu class="{userClass} flex flex-column {gap} flex-wrap mr-1 sm:mr-0 sm:w-72 text-stone-600 dark:text-stone-300">
    <p class="flex flex-row {gap} flex-wrap ">
        {#key filteredTags}
            {#if filteredTags.length > 0}
                {#each filteredTags as tag (tag.label)}
                    <Tag name={tag.label} color={tag.color} {s}
                        onCustomClick={(e) => onTagSelected(tag)}/>
                {/each}
            {:else if allowNewTags}
                <p>
                    { i18n({en: 'Create tag:', es: 'Crear etiqueta:', pl: 'Utwrórz etykietę:'}) }
                </p>
            {:else}
                <p>
                    { i18n({en: 'No tags', es: 'Sin etiquetas', pl: 'Żadnych etykiet'}) }
                </p>
            {/if}

        {/key}
    </p>

    <section class="flex flex-row {gap} w-full">

    <input  type="text" name="text" id="text"
            autocomplete="off" 
            class="block bg-stone-100 dark:bg-stone-800 flex-1 text-stone-700 dark:text-stone-200"
            bind:value={inputText}
            on:input={onTextInput}
            on:blur={onTextBlur}
            on:keydown={onKeyDown}
            placeholder={i18n({en: 'Type to filter or create tag', es: 'Escriba para filtrar o crear una etiqueta', pl: 'Wpisz, aby filtrować lub utworzyć tag'})}>
        {#if allowNewTags}
            <button class="block w-5 h-5 mt-0.5 ml-auto mr-2
                    text-stone-600 hover:text-stone-800 hover:bg-stone-200 active:bg-stone-200 border-stone-200
                    dark:text-stone-300 dark:hover:text-white dark:hover:bg-stone-800 dark:active:bg-stone-600 dark:border-stone-600"
                    class:hidden={inputText.length == 0}
                    on:click={onAddTag}>
                <FaPlus/>
            </button>
        {/if}
    </section>
</menu>

{:else if view == COLORS_PALETTE}
    <TagColorsPalette onSelect={onNewTagColorSelected}/>
{/if}

<style>

input:focus {
    outline: 0px solid transparent;
  }

  </style>