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

<figure class=" bg-stone-200 dark:bg-stone-700 outline outline-8 outline-stone-200 dark:outline-stone-700 ring-1 ring-offset-8 ring-stone-300 dark:ring-stone-700">

    <!-- whitespace-nowrap overflow-clip  -->
    <h4  class=" font-semibold min-h-[1.75rem]
                 sm:min-h-[1.25rem]
                "
                use:editable={{
                    action: (text) => onInsert(text, ''),
                    active: false,
                    onSoftEnter: softEnter
                }}
                bind:this={titleElement}>
    </h4>

    {#if editSummary}
        <figcaption class="
                max-h-[75px]"
                use:editable={{
                    action: (text) => onSummaryChanged(text),
                    active: false,
                    onFinish: (d) => {editSummary = false}}}
                bind:this={summaryElement}>
            {summary}
        </figcaption>
    {/if}



    </figure>