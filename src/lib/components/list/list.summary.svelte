<script lang="ts">
    import {getContext} from 'svelte'
    import type {rList_definition} from './List'

    export let a        :string;
    export let editable :boolean = false;
    
    let definition :rList_definition = getContext("rList-definition");
    
    definition.summary = a;
    definition.summary_editable = editable;

</script>
