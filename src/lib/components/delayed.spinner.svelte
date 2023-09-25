<script lang="ts">
    import {Spinner} from 'flowbite-svelte'
    import { onMount } from 'svelte';

    export let delay :number = 100;
    let visible = false;

    onMount(() => {
        
        visible = false;
        setTimeout( ()=> {
            visible = true;
        }, delay);
        return () => {}
    })

</script>


{#if visible}
    <Spinner/>
{/if}