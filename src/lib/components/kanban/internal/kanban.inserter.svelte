<script lang="ts">
	import {    start_editing,
                editable} from '$lib'

    export let oninsert;

    export function run(onclose)
    {
        start_editing(insertion_paragraph, onclose)
    }

    let insertion_paragraph;

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<li class=" mx-2 pt-2 pb-4 px-1 rounded-md border border-transparent
            bg-stone-100 dark:bg-stone-700">

    <h3  class=" text-lg font-semibold min-h-[1.75rem]
                sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                whitespace-nowrap overflow-clip w-full sm:flex-none sm:w-2/3"
                use:editable={oninsert}
                bind:this={insertion_paragraph}>
        
    </h3>
</li>