<script lang="ts">
    import {tick} from 'svelte'
	import {    startEditing,
                editable} from '$lib'

    export let onInsert;

    let onClose;
    export function run(onclose)
    {
        onClose = onclose;
        startEditing(titleElement, onclose)
    }

    let titleElement;

    let title: string = ''
    let summary: string = ''
    let editSummary: boolean = false;
    let summaryElement;

    async function softEnter(t: string)
    {
        title = t;
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

<!-- svelte-ignore a11y-click-events-have-key-events -->

<li class=" mx-2 pt-2 pb-4 px-1 rounded-md border border-transparent
            bg-stone-100 dark:bg-stone-700">

    <!-- whitespace-nowrap overflow-clip  -->
    <h3  class=" text-base font-semibold min-h-[1.75rem]
                 sm:min-h-[1.25rem]
                w-full sm:flex-none "
                use:editable={{
                    action: (text) => onInsert(text, ''),
                    active: false,
                    onSoftEnter: softEnter
                }}
                bind:this={titleElement}>
    </h3>

    {#if editSummary}
        <p class="  text-sm min-h-[1.25rem]
                text-stone-400
                max-h-[75px] 
                overflow-hidden"
                use:editable={{
                    action: (text) => onSummaryChanged(text), 
                    active: false,
                    onFinish: (d) => {editSummary = false}}}
                bind:this={summaryElement}>
            {summary}
        </p>
    {/if}
    
    

</li>