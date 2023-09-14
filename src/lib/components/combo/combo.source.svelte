<script lang="ts">
    import {getContext} from 'svelte'
    import type {rCombo_definition} from './combo'

    export let collection :string = '';
    export let on_collect = undefined;
    export let key :string = '';
    export let name :string = ''; 
    export let avatar :string = '';

    let definition :rCombo_definition = getContext("rCombo-definition");

    definition.collection_expr = collection;
    definition.on_collect = on_collect;
    definition.element_key = key;
    definition.element_name = name;
    definition.element_avatar = avatar;

</script>
