<script lang="ts">
    import {getContext} from 'svelte'
    import type {rTable_definition} from './table'

    export let e :any;
    export let idx :number;

    let definition :rTable_definition = null;
    definition = getContext('rTable-definition');

    if(!idx)
        definition.items = new Array<any>();

    definition.items.push(e);
    definition.items_ticket++;

    //console.log('table item: ', idx,  e, definition.items_ticket);
</script>