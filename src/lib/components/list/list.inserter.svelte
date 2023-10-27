<script lang="ts">
    import {getContext} from 'svelte'
    import type {rList_definition} from './List'

    export let action :Function;

    
    let definition :rList_definition = getContext("rList-definition");
    
    definition.can_insert = true
    definition.oninsert = action;
</script>
