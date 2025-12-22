<script>
  export let my = true
</script>

{#if my}



<figure {...$$props}>
<slot/>
</figure>



{:else}



<div {...$$props}>
<slot/>
</div>



{/if}