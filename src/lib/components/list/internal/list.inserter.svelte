<script lang="ts">
    import {editable, startEditing} from '../../../utils'
    import Icon from '../../icon.svelte'
    import { FaPlus } from 'svelte-icons/fa'
    
    export let onInsert;
    export let icon = false;
    export function run(onclose)
    {
        startEditing(insertion_paragraph, onclose)
    }

    let insertion_paragraph;

    
</script>

<section    class="mt-3 flex flex-row my-0  w-full text-lg sm:text-sm text-stone-700 dark:text-stone-400 cursor-default rounded-md border border-transparent bg-stone-200 dark:bg-stone-700">
    {#if icon}
        <!--Icon   size={3} 
                component={FaPlus}  
                class="mt-1.5 ml-2 "/-->
        <div class="h-5 w-5 sm:h-4 sm:w-4 mt-2 sm:mt-1.5 ml-2"></div>
    {/if}

    <p  class=" ml-3 py-1
                text-lg font-semibold min-h-[1.75rem]
                sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                whitespace-nowrap overflow-clip flex-none w-1/2 sm:w-1/3" tabindex="0"
        bind:this={insertion_paragraph}
        use:editable={onInsert} >
    </p>
</section>