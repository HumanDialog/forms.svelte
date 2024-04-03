<script lang="ts">
import {
            editable as _editable,
    } from '../../../utils'

    export let id :string;
    export let readonly :boolean = false;
    export let text :string = "";
    export let placeholder :boolean = false;

    export let editable :any;
    export let click_edit :any;

    let user_class = $$props.class ?? "";

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if readonly}
    <p {id} class="  sm:text-xs sm:min-h-[1rem]
                    text-base min-h-[1.5rem]
                    text-stone-400 
                    {user_class}"
                    on:click>
        {text}
    </p>
{:else if text}
    <p {id} class=" sm:text-xs sm:min-h-[1rem]
                    text-base min-h-[1.5rem]
                    text-stone-400 
                    {user_class}"
            use:_editable={editable}
            on:click>
        {text}
</p>
{:else if placeholder}
    <p   {id} class="sm:text-xs sm:min-h-[1rem]
                     text-base min-h-[1.5rem]
                     text-stone-400 
                     {user_class}"
            use:_editable={editable}
            on:click>
    </p>
{/if}
    
