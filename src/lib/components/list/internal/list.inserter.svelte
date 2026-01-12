<script lang="ts">
    import {tick} from 'svelte'
    import {editable, startEditing} from '../../../utils'
    import Icon from '../../icon.svelte'
    import { FaPlus } from 'svelte-icons/fa'

    export let onInsert;
    export let icon = false;

    let onClose;
    export function run(onclose)
    {
        onClose = onclose
        startEditing(titleElement, onclose)
    }

    let titleElement;
    let summaryElement;

    let title: string = ''
    let summary: string = ''
    let editSummary: boolean = false;
    async function softEnter(text: string)
    {
        title = text;
        editSummary = true;
        await tick();
        startEditing(summaryElement, onClose);
    }

    async function onSummaryChanged(text: string)
    {
        summary = text;
        await onInsert(title, summary);
    }


</script>


<figure class="pl-8
            bg-stone-200 dark:bg-stone-700
            outline outline-8
            outline-stone-200 dark:outline-stone-700
            ring-1 ring-offset-8
            ring-stone-300 dark:ring-stone-700
            ">
        <h4 class="-indent-8">
            <div class="inline-block w-4 h-4 ml-0 mr-4 align-baseline
                    text-stone-700 dark:text-stone-400 ">
             </div>
             <span
                bind:this={titleElement}
                use:editable={{
                    action: (text) => onInsert(text, ''),
                    active: false,
                    onSoftEnter: softEnter
                    }} ></span>
        </h4>

        {#if editSummary}
            <figcaption
                    bind:this={summaryElement}
                    use:editable={{
                    action: onSummaryChanged,
                    active: false,
                    onFinish: (d) => {editSummary=false}
                }}
                >{summary}</figcaption>
        {/if}
</figure>

