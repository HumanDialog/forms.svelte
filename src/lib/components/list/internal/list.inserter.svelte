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

<section    class=" my-1 w-full text-base text-stone-700 dark:text-stone-400 cursor-default rounded-md border border-transparent bg-stone-200 dark:bg-stone-700">
    <div class="flex flex-row">
        {#if icon}
            <!--Icon   size={3} 
                    component={FaPlus}  
                    class="mt-1.5 ml-2 "/-->
            <div class="h-5 w-5 sm:h-4 sm:w-4 mt-2 sm:mt-1.5 ml-2"></div>
        {/if}

        <p  class=" ml-3 py-1
                    text-base font-semibold min-h-[1.75rem]
                    sm:min-h-[1.25rem]
                    whitespace-nowrap overflow-clip flex-none w-1/2 sm:w-1/3" tabindex="0"
            bind:this={titleElement}
            use:editable={{
                action: (text) => onInsert(text, ''),
                active: false,
                onSoftEnter: softEnter
                }} >
        </p>
    </div>

    {#if editSummary}
        <p  bind:this={summaryElement}
            class="     ml-10 sm:ml-9 
                        sm:min-h-[1rem]
                        text-sm min-h-[1.5rem]
                        text-stone-400"
                use:editable={{
                    action: onSummaryChanged,
                    active: false,
                    onFinish: (d) => {editSummary=false}
                }}>
            {summary}
        </p>
    {/if}
</section>