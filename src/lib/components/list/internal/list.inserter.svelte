<script lang="ts">
    import {editable, start_editing} from '../../../utils'
    import Icon from '../../icon.svelte'
    import { FaPlus } from 'svelte-icons/fa'
    
    export let oninsert;
    export let icon = false;
    export function run(onclose)
    {
        start_editing(insertion_paragraph, onclose)
    }

    let insertion_paragraph;

    
</script>

<section    class="flex flex-row my-0  w-full text-sm text-slate-700 dark:text-slate-400 cursor-default rounded-md border-2 border-transparent bg-gray-200 dark:bg-gray-700">
    {#if icon}
        <!--Icon   size={3} 
                component={FaPlus}  
                class="mt-1.5 ml-2 "/-->
        <div class="h-4 w-4 mt-1.5 ml-2"></div>
    {/if}

    <p  class="ml-3 py-1 font-bold whitespace-nowrap overflow-clip flex-none w-1/2 sm:w-1/3" tabindex="0"
        bind:this={insertion_paragraph}
        use:editable={oninsert} >
    </p>
</section>